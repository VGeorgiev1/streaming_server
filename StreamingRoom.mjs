import Room from './Room'
import * as fs from 'fs';
import WebRtcConnection from './WebRtcConnection'
export default class StreamingRoom extends Room{
    constructor(name,ownerId,channel,io){
        super(name, 'streaming',channel,io)
        this.viewers = []
        this.viewers_connections = []
        this.broadcaster_transceivers = {} 
        this.owner = ownerId
        this.broadcaster_connection;
        this.active = false;
        this.topics = [];
        this.broadcaster_constrains = {}
    }
    remote_relay_handler(peerConnection, disconnecthandler){
        peerConnection.on('relaySessionDescription', async (data)=>{
            if (data.socket_id == this.broadcaster_connection.socket.id) {
				await this.broadcaster_connection.applyAnswer(data.session_description);
				this.broadcaster_connection.attachIceCandidateListener();
			} else {
				await this.viewers_connections[data.socket_id].applyAnswer(data.session_description);
				this.viewers_connections[data.socket_id].attachIceCandidateListener();
			}
        })
        peerConnection.on('relayICECandidate', (data)=>{
            if(data.socket_id == this.broadcaster_connection.socket.id){
                this.broadcaster_connection.applyCandidate(data.candidate)
            }else{
                this.viewers_connections[data.socket_id].applyCandidate(data.candidate)
            }
        })
        peerConnection.on('ready-state', data=>{
            if(this.broadcaster_connection){
                if(data.socket_id == this.broadcaster_connection.socket.id){
                    peerConnection.emit('sessionDescription', {socket_id: data.socket_id, session_description: this.broadcaster_connection.localDescription})
                }else{
                    peerConnection.emit('sessionDescription', {socket_id: data.socket_id, session_description: this.viewers_connections[data.socket_id].localDescription})
                }
            }
        })
        

    }
    async addBroadcaster(socket, constrains, peerId, dissconnectHandler){
        this.broadcaster_constrains = constrains
        this.broadcaster_connection = new WebRtcConnection(socket,peerId,constrains,{
            beforeOffer: async (peerConnection) =>{
                if(constrains.audio){
                    this.broadcaster_transceivers['audio'] = peerConnection.addTransceiver('audio');
                }
                if(constrains.video){
                    this.broadcaster_transceivers['video'] = peerConnection.addTransceiver('video');
                }
            },
            onIceCandidate: ((event)=>{
                if (event.candidate) {
                    socket.emit('iceCandidate',
                    {
                        'socket_id': socket.id,
                        'ice_candidate': {
                            'sdpMLineIndex': event.candidate.sdpMLineIndex,
                            'candidate': event.candidate.candidate
                        }
                    });
                }
            })
        })
        

        await this.broadcaster_connection.doOffer();

        this.remote_relay_handler(this.broadcaster_connection, dissconnectHandler)
        this.broadcaster_connection.emit('addPeer', {socket_id: socket.id, localDescription: this.broadcaster_connection.localDescription})
        
        this.broadcaster_connection.on('disconnect', ()=>{
            for(let viewer in this.viewers_connections){
                this.viewers_connections[viewer].emit('removePeer', {'socket_id': this.viewers_connections[viewer].socket.id})
            }
            if(dissconnectHandler){  
                dissconnectHandler();
            }
        })
        this.addConnection(socket.id,this.broadcaster_connection)
        

        if(Object.keys(this.viewers_connections).length != 0){
            for(let viewer in this.viewers_connections){
                let promises = [];
                for(let transceiver in this.broadcaster_transceivers){
                    this.viewers_connections[viewer].peerConnection.addTrack(this.broadcaster_transceivers[transceiver].receiver.track)
                }
            }
        }
    }
    
    async addViewer(socket,constrains,peerId, dissconnectHandler){
        let viewer = new WebRtcConnection(socket,peerId, constrains,{
            beforeOffer: (peerConnection) =>{
                    let promises = [];
                    for(let transceiver in this.broadcaster_transceivers){
                        let new_t = peerConnection.addTransceiver(this.broadcaster_transceivers[transceiver].receiver.track.kind); 
                        promises.push(new_t.sender.replaceTrack(this.broadcaster_transceivers[transceiver].receiver.track))
                    }
                    return Promise.all(promises);
            },
            onIceCandidate: ((event)=>{
                    if (event.candidate) {
                        socket.emit('iceCandidate',
                        {
                            'socket_id': socket.id,
                            'ice_candidate': {
                                'sdpMLineIndex': event.candidate.sdpMLineIndex,
                                'candidate': event.candidate.candidate
                            }
                        });
                    }
            })
        })
        await viewer.doOffer();
        console.log(viewer.localDescription.sdp)
        this.viewers_connections[socket.id] = viewer


        viewer.peerConnection.onnegotiationneeded = async(e)=> {
            
            await viewer.doOffer()
            console.log(viewer.localDescription.sdp)

            viewer.emit('sessionDescription', {socket_id: socket.id, session_description: viewer.localDescription})
        } 

        this.remote_relay_handler(viewer, dissconnectHandler)
        viewer.emit('addPeer', {socket_id: socket.id, localDescription: this.viewers_connections[socket.id].localDescription, constrains: this.broadcaster_constrains})
        
        this.addConnection(socket.id,viewer)
    }
    addSocket(socket,constrains,peerId){
        this.triggerConnect(socket)
        if(this.isBroadcaster(peerId) ){
            if(this.active == true){
                console.log("Room already activated!")
            }
            this.active = true;
            this.addBroadcaster(socket,constrains,peerId, ()=>{
                this.active = false
            })
        }else{
            if(this.viewers.indexOf(peerId) != -1){
                console.log("Viewer already exists!")
                //return;
            }

            this.viewers.push(peerId)
            constrains = null
            this.addViewer(socket,constrains, peerId, (id)=>{
                this.viewers.splice(this.viewers.indexOf(peerId),1)
            })
        }
        
    }
    isActive(){
        return this.active
    }
    isBroadcaster(id){
        return id == this.owner
    }
    
}