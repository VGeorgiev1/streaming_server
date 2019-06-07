import Room from './Room.mjs'
import WebRtcConnection from './WebRtcConnection.mjs'
import { connect } from 'tls';
export default class StreamingRoom extends Room{
    constructor(name,ownerId,channel,io,settings){
        super(name, 'streaming',channel,io)
        this.settings = settings
        this.owner = ownerId
        this.viewers = []
        this.viewers_connections = {}
        this.broadcaster_transceivers = {}
        this.broadcaster_connection;
        this.active = false;
        this.topics = [];
        this.broadcaster_constrains = {}
        this.tracks = {}
        this.setupStartHandlers()
        this.broadcaster_handlers = {
            'relaySessionDescription': async (data)=>{
                if(data.session_description.type == 'offer'){
                    data.session_description.sdp = this.broadcaster_connection.setProperties(data.session_description.sdp,data.properties)
                    await this.broadcaster_connection.applyAnswer(data.session_description)
                    await this.broadcaster_connection.doAnswer()
                    for(let viewer in this.viewers_connections){
                        await this.viewers_connections[viewer].doOffer({properties: data.properties});
                        this.viewers_connections[viewer].emit('sessionDescription', {"socket_id":this.viewers_connections[viewer].socket.id, "session_description": this.viewers_connections[viewer].localDescription, "properties": data.properties})
                    }
                    this.broadcaster_connection.emit('sessionDescription', {"socket_id": data.socket_id, "session_description": this.broadcaster_connection.localDescription, 'properties': this.broadcaster_connection.properties})
                }else{
				    await this.broadcaster_connection.applyAnswer(data.session_description,data.properties);
				    this.broadcaster_connection.attachIceCandidateListener();
                }
            },
            'ready-state': (data)=>{
                this.broadcaster_connection.properties = data.properties
                this.broadcaster_connection.emit('sessionDescription', {socket_id: data.socket_id, session_description: this.connections.get(data.socket_id).localDescription, properties: this.broadcaster_connection.properties})
            },
            'topics': (predictions)=>{
                if(this.settings.max_topics){
                    if(this.topics.length >= this.settings.max_topics){
                        this.topics = []
                    }
                }
                predictions.map(p=>this.topics.push(p.class))
            },
            'new_constrains': (data)=>{
                this.broadcaster_connection.constrains = data
                for(let viewer in this.viewers_connections){
                    this.viewers_connections[viewer].emit('relayNewConstrains', {"socket_id":this.viewers_connections[viewer].socket.id, "constrains":data})
                }
            }
        }
        this.viewer_handlers ={
            'relaySessionDescription': async(data)=>{
                let connection = this.connections.get(data.socket_id)
				await connection.applyAnswer(data.session_description,data.properties);
				connection.attachIceCandidateListener();
            },
            'ready-state': (data)=>{
                if(this.broadcaster_connection){
                    this.connections.get(data.socket_id).emit('sessionDescription', {socket_id: data.socket_id, session_description: this.connections.get(data.socket_id).localDescription, properties: this.broadcaster_connection.properties})
                }
            }
        }
    }
    attachHandlers(connection){
        if(this.broadcaster_connection && (connection.socket.id == this.broadcaster_connection.socket.id)){
            for(let handler in this.broadcaster_handlers){
                connection.on(handler, this.broadcaster_handlers[handler])
            }
        }else{
            for(let handler in this.viewer_handlers){
                connection.on(handler, this.viewer_handlers[handler])
            } 
        }
        connection.on('disconnect', connection.disconnectHandler);
    }
    async addBroadcaster(socket, constrains, peerId, disconnectHandler){
        this.broadcaster_constrains = constrains
        this.broadcaster_connection = new WebRtcConnection(socket,peerId,constrains,{
            disconnectHandler: disconnectHandler,
            ontrack: (event) =>{
                let stream = event.streams[0]
                for(let track of stream.getTracks()){
                    
                    if(!this.tracks[track.id]){
                        this.tracks[track.id] = track
                        this.broadcaster_constrains[track.kind] = true;
                        for(let viewer in this.viewers_connections){
                            let senders = this.viewers_connections[viewer].peerConnection.getSenders();

                            senders = this.viewers_connections[viewer].peerConnection.getSenders();
                            
                            for(let sender of senders){
                                if(sender.track && sender.track.id == track.id){
                                    sender.replaceTrack(track)
                                    break;
                                }else{
                                    this.viewers_connections[viewer].peerConnection.addTrack(track);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        })
        await this.broadcaster_connection.doOffer();

        this.broadcaster_connection.emit('addPeer', {socket_id: socket.id, localDescription: this.broadcaster_connection.localDescription})
        
        this.addConnection(socket.id,this.broadcaster_connection)
    }
    
    async addViewer(socket,peerId, disconnectHandler){
        let viewer = new WebRtcConnection(socket,peerId, null,{
            disconnectHandler: disconnectHandler
        })
        await viewer.doOffer();
        this.viewers_connections[socket.id] = viewer

        
        viewer.peerConnection.onnegotiationneeded = async(e)=> {
            await viewer.doOffer();
            viewer.emit('sessionDescription', {socket_id: socket.id, session_description: viewer.localDescription})
        }

        viewer.emit('addPeer', {socket_id: socket.id, localDescription: this.viewers_connections[socket.id].localDescription, constrains: this.broadcaster_constrains})
        this.addConnection(socket.id,viewer)
    }
    getDetails(){
        return {type:this.type,tick:this.settings.tick,active:this.active}
    }
    addSocket(socket,constrains,peerId){
        this.triggerConnect(socket)
        if(this.isBroadcaster(peerId) ){
            if(this.active == true){
                console.log("Room already active!")
                return;
            }
            this.active = true;
            this.addBroadcaster(socket,constrains,peerId, ()=>{
                this.active = false
                for(let transceiver in this.broadcaster_transceivers){
                    this.broadcaster_transceivers[transceiver].stop(); 
                }
                for(let track in this.tracks){
                    this.tracks[track].stop();
                }
                this.tracks = {}
                this.topics = []
                this.broadcaster_transceivers = {};
                this.broadcaster_connection = null;
                for(let viewer in this.viewers_connections){
                    this.viewers_connections[viewer].emit('removePeer', {'socket_id': this.viewers_connections[viewer].socket.id})
                }
            })
        }else{
            if(this.viewers.indexOf(peerId) != -1){
                console.log("Viewer already exists!")
                return;
            }

            this.viewers.push(peerId)
            this.addViewer(socket, peerId, (id)=>{
                this.viewers.splice(this.viewers.indexOf(peerId),1)
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