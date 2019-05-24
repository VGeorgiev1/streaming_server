import Room from './Room'
import * as fs from 'fs';
import WebRtcConnection from './WebRtcConnection'
export default class StreamingRoom extends Room{
    constructor(name,ownerId,channel,io){
        super(name, 'streaming',channel,io)
        this.viewers = []
        this.viewers_connections = {}
        this.broadcaster_transceivers = [] 
        this.owner = ownerId
        this.broadcaster_connection;
        this.active = false;
        this.topics = [];
        this.broadcaster_constrains = {}
        this.senders = {}
        this.tracks = {}
    }
    remote_relay_handler(peerConnection, disconnecthandler){
        peerConnection.on('relaySessionDescription', async (data)=>{
            if (data.socket_id == this.broadcaster_connection.socket.id) {
                 if(data.session_description.type == 'offer'){
                    data.session_description.sdp = peerConnection.setProperties(data.session_description.sdp,data.properties)
                    await this.broadcaster_connection.applyAnswer(data.session_description)
                    await this.broadcaster_connection.doAnswer()
                    for(let viewer in this.viewers_connections){
                        await this.viewers_connections[viewer].doOffer({properties: data.properties});
                        this.viewers_connections[viewer].emit('sessionDescription', {"socket_id":this.viewers_connections[viewer].socket.id, "session_description": this.viewers_connections[viewer].localDescription, "properties": data.properties})
                    }
                    peerConnection.emit('sessionDescription', {"socket_id": data.socket_id, "session_description": this.broadcaster_connection.localDescription})
                 }else{
				    await this.broadcaster_connection.applyAnswer(data.session_description,data.properties);
				    this.broadcaster_connection.attachIceCandidateListener();
                }
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
                    peerConnection.emit('sessionDescription', {socket_id: data.socket_id, session_description: this.broadcaster_connection.localDescription, properties: data.properties})
                    this.broadcaster_connection.properties = data.properties
                }else{
                    peerConnection.emit('sessionDescription', {socket_id: data.socket_id, session_description: this.viewers_connections[data.socket_id].localDescription, properties: this.broadcaster_connection.properties})
                }
            }
        })
        
 
    }
    async addBroadcaster(socket, constrains, peerId, dissconnectHandler){
        this.broadcaster_constrains = constrains
        this.broadcaster_connection = new WebRtcConnection(socket,peerId,constrains,{
            beforeOffer: async (peerConnection) =>{
                this.broadcaster_transceivers.push(peerConnection.addTransceiver('audio'));
                this.broadcaster_transceivers.push(peerConnection.addTransceiver('video'));
            },
            ontrack: (event) =>{
                
                let stream = event.streams[0]
                for(let track of stream.getTracks()){
                    if(!this.tracks[track.id]){
                        this.tracks[track.id] = track
                        for(let viewer in this.viewers_connections){
                            let senders = this.viewers_connections[viewer].peerConnection.getSenders();
                            if(senders.length == 0){
                                for(let transceiver of this.broadcaster_transceivers){
                                    this.viewers_connections[viewer].peerConnection.addTransceiver(transceiver.receiver.track.kind)
                                }
                            }
                            senders = this.viewers_connections[viewer].peerConnection.getSenders();
                            for(let sender of senders){
                                if(sender.track && sender.track.id == track.id){
                                    console.log('repalce track shuld be oke')
                                    sender.replaceTrack(track)
                                    break;
                                }else{
                                    console.log('add track shuld be oke')
                                    this.viewers_connections[viewer].peerConnection.addTrack(track);
                                    break;
                                }
                            }
                        }
                    }
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

        await this.broadcaster_connection.doOffer({beforeOffer: true});

        this.remote_relay_handler(this.broadcaster_connection, dissconnectHandler)
        this.broadcaster_connection.emit('addPeer', {socket_id: socket.id, localDescription: this.broadcaster_connection.localDescription})
        
        this.broadcaster_connection.on('disconnect', ()=>{
            for(let transceiver in this.broadcaster_transceivers){
                this.broadcaster_transceivers[transceiver].stop();
                delete this.broadcaster_transceivers[transceiver] 
            }
            this.broadcaster_connection = null;
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
                for(let track in this.tracks){
                    this.viewers_connections[viewer].peerConnection.addTrack(this.tracks[track])
                }
            }
        }
    }
    
    async addViewer(socket,constrains,peerId, dissconnectHandler){
        let viewer = new WebRtcConnection(socket,peerId, constrains,{
            beforeOffer: (peerConnection) =>{
                    let promises = [];
                    console.log(this.broadcaster_transceivers)
                    for(let transceiver of this.broadcaster_transceivers){
                        
                        if(transceiver){
                            let new_t = peerConnection.addTransceiver(transceiver.receiver.track.kind); 
                            promises.push(new_t.sender.replaceTrack(transceiver.receiver.track))
                        }
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
        await viewer.doOffer({beforeOffer: true});
        this.viewers_connections[socket.id] = viewer
        viewer.peerConnection.onnegotiationneeded = async(e)=> {
            await viewer.doOffer({beforeOffer: false});
            viewer.emit('sessionDescription', {socket_id: socket.id, session_description: viewer.localDescription})
        } 
        this.remote_relay_handler(viewer, dissconnectHandler)
        viewer.emit('addPeer', {socket_id: socket.id, localDescription: this.viewers_connections[socket.id].localDescription, constrains: this.broadcaster_constrains})
        viewer.on('disconnect', ()=>{
            if(dissconnectHandler){
                dissconnectHandler();
            }
        })
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
            }

            this.viewers.push(peerId)
            constrains = null
            this.addViewer(socket,constrains, peerId, (id)=>{
                this.viewers.splice(this.viewers.indexOf(peerId),1)
                console.log('delete')
                delete this.viewers_connections[socket.id]
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