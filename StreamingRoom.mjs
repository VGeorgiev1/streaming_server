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
    remote_relay_handler(peerConnection, socket, disconnecthandler){
        socket.on('relaySessionDescription', async (data)=>{
            if (data.socket_id == this.broadcaster_connection.id) {
				await this.broadcaster_connection.applyAnswer(data.session_description);
				this.broadcaster_connection.attachIceCandidateListener();
			} else {
				await this.viewers_connections[data.socket_id].applyAnswer(data.session_description);
				this.viewers_connections[data.socket_id].attachIceCandidateListener();
			}
        })
        socket.on('relayICECandidate', (data)=>{
            if(data.socket_id == this.broadcaster_connection.id){
                this.broadcaster_connection.applyCandidate(data.candidate)
            }else{
                this.viewers_connections[data.socket_id].applyCandidate(data.candidate)
            }
        })
        socket.on('ready-state', data=>{
            if(this.broadcaster_connection){
                if(data.socket_id == this.broadcaster_connection.id){
                    socket.emit('sessionDescription', {socket_id: data.socket_id, session_description: this.broadcaster_connection.localDescription})
                }else{
                    socket.emit('sessionDescription', {socket_id: data.socket_id, session_description: this.viewers_connections[data.socket_id].localDescription})
                }
            }
        })
        socket.on('disconnect', ()=>{
            for(let viewer in this.viewers_connections){
                
            }
            if(disconnecthandler){  
                disconnecthandler();
            }
        })

    }
    async addBroadcaster(socket, constrains, peerId, dissconnectHandler){
        this.broadcaster_constrains = constrains
        this.broadcaster_connection = new WebRtcConnection(socket.id,
        async (peerConnection) =>{
            if(constrains.audio){
                this.broadcaster_transceivers['audio'] = peerConnection.addTransceiver('audio');
            }
            if(constrains.video){
                this.broadcaster_transceivers['video'] = peerConnection.addTransceiver('video');
            }
        },
        ((event)=>{
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
        }))
        await this.broadcaster_connection.doOffer();
        this.remote_relay_handler(this.broadcaster_connection, socket, dissconnectHandler)
        socket.emit('addPeer', {socket_id: socket.id, localDescription: this.broadcaster_connection.localDescription})
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
        this.viewers_connections[socket.id] = new WebRtcConnection(peerId,
        (peerConnection) =>{
            let promises = [];
            for(let transceiver in this.broadcaster_transceivers){
                let new_t = peerConnection.addTransceiver(this.broadcaster_transceivers[transceiver].receiver.track.kind); 
                promises.push(new_t.sender.replaceTrack(this.broadcaster_transceivers[transceiver].receiver.track))
            }
			return Promise.all(promises);
        },
        ((event)=>{
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
        }))
        await this.viewers_connections[socket.id].doOffer();
        let viewer = this.viewers_connections[socket.id]
        viewer.peerConnection.onnegotiationneeded = async(e)=> {
            await viewer.doOffer()
            socket.emit('sessionDescription', {socket_id: socket.id, session_description: viewer.localDescription})
        } 
        this.remote_relay_handler(this.viewers_connections[peerId], socket, dissconnectHandler)
        socket.emit('addPeer', {socket_id: socket.id, localDescription: this.viewers_connections[socket.id].localDescription, constrains: this.broadcaster_constrains})
        
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