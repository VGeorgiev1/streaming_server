import Room from './Room.mjs'
import Connection from './Connection.mjs';
export default class SurvillianceRoom extends Room{
    constructor(name,ownerId,channel,io){
        super(name, 'surveillance',channel,io)
        this.broadcasterStreams = [] 
        this.spectator = {}
        this.broadcasters = {}
        this.owner = ownerId
        this.broadcasters_list = []
        this.active = false
    }
    addBroadcaster(socket, peerId, constrains,properties,media_state,dissconnectHandler)
    {
        let broadcaster = new Connection(socket,peerId,constrains,properties,dissconnectHandler);
        this.broadcasters[socket.id] = broadcaster
        broadcaster.media_state = media_state
        this.addConnection(socket.id,broadcaster)
        this.attachHandlers(broadcaster,dissconnectHandler)
        broadcaster.on('new_properties', (data)=>{
            
            broadcaster.properties = data.properties
            broadcaster.constrains = data.constrains
            broadcaster.media_state = data.media_state
            this.spectator.emit('properties', {id: socket.id, properties: data.properties, constrains: broadcaster.constrains, media_state:data.media_state})
        })
        if(this.active){
            this.spectator.emit('addPeer', {'socket_id': socket.id, 'should_create_offer': false, 'constrains': constrains, 'properties': properties, 'media_state':broadcaster.media_state })
            broadcaster.emit('addPeer', {'socket_id': this.spectator.socket.id, 'should_create_offer': true, 'constrains': null, 'properties': null})
        }
    }
    addSpectator(socket, peerId,dissconnectHandler){
        this.spectator = new Connection(socket,peerId,null,null,dissconnectHandler);
        this.addConnection(socket.id,this.spectator)
        this.attachHandlers(this.spectator, dissconnectHandler)
        this.attachControlHandlers();
        if(this.active){
            for(let broadcaster in this.broadcasters){
                this.broadcasters[broadcaster].emit('addPeer', {'socket_id': socket.id, 'should_create_offer': true, 'constrains': null, 'properties': null})
                this.spectator.emit('addPeer', {'socket_id': this.broadcasters[broadcaster].socket.id, 'should_create_offer': false, 'constrains': this.broadcasters[broadcaster].constrains, 'properties': this.broadcasters[broadcaster].properties, 'media_state': this.broadcasters[broadcaster].media_state})
            }
        }
    }
    attachControlHandlers(){
        this.spectator.on('request_video', (data)=>{
            this.connections.get(data.socket_id).emit('request_video')
        })
        this.spectator.on('request_audio', (data)=>{
            this.connections.get(data.socket_id).emit('request_audio')
        })
        this.spectator.on('mute_audio', (data)=>{
            this.connections.get(data.socket_id).emit('mute_audio')
        })
        this.spectator.on('mute_video', (data)=>{
            this.connections.get(data.socket_id).emit('mute_video')
        })
        this.spectator.on('audio_bitrate', (data)=>{
            this.connections.get(data.socket_id).emit('audio_bitrate', {val: data.val})
        })
        this.spectator.on('video_bitrate', (data)=>{
            this.connections.get(data.socket_id).emit('video_bitrate', {val: data.val})
        })
        this.spectator.on('change_audio', (data)=>{
            this.connections.get(data.socket_id).emit('change_audio', {device_id: data.track_id})
        })
        this.spectator.on('change_video', (data)=>{
            this.connections.get(data.socket_id).emit('change_video', {device_id: data.track_id})
        })
    }
    isOwner(id){
        return id == this.owner
    }
    isBroadcaster(id){
        return !this.isOwner(id)
    }
    addSocket(socket,constrains,peerId, properties,media_state){
        if(!this.isOwner(peerId)){
            if(this.broadcasters_list.indexOf(peerId) != -1){
                console.log('Broadcaster already exits')
                return;
            }
            this.broadcasters_list.push(peerId)
            this.addBroadcaster(socket, peerId,constrains,properties,media_state,()=>{
                this.broadcasters_list.splice(this.broadcasters_list.indexOf(peerId),1)
            })
        }
        else{
            this.active = true;
            this.addSpectator(socket, peerId,()=>{
                this.active = false
            })
        }
        
    }
    
}