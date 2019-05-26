import Room from './Room.mjs'
import Connection from './public/js/Connection';
export default class SurvillianceRoom extends Room{
    constructor(name,ownerId,channel,io){
        super(name, 'surveillance',channel,io)
        this.broadcasterStreams = [] 
        this.spectator = {}
        this.broadcasters = {}
        this.owner = ownerId
        this.active = false
    }
    addBroadcaster(socket, peerId, constrains,properties,dissconnectHandler)
    {
        let broadcaster = new Connection(socket,peerId,constrains,properties,dissconnectHandler);
        this.broadcasters[socket_id] = broadcaster
        this.addConnection(socket.id,broadcaster)
        this.handshakeHandlers(broadcaster)
        this.muteUnmuteHandler(broadcaster)
        this.partHandler(broadcaster, dissconnectHandler)
        this.disconnectHandler(broadcaster, dissconnectHandler)

        if(this.active){
            this.spectator.emit('addPeer', {'socket_id': socket.id, 'should_create_offer': false, 'constrains': constrains, 'properties': properties})
            broadcaster.emit('addPeer', {'socket_id': this.spectator.socket.id, 'should_create_offer': true, 'constrains': null, 'properties': null})
        }
    }
    addSpectator(socket, peerId,dissconnectHandler){
        this.spectator = new Connection(socket,peerId,null,null,dissconnectHandler);
        this.addConnection(socket.id,broadcaster)
        this.handshakeHandlers(broadcaster)
        this.muteUnmuteHandler(broadcaster)
        this.partHandler(broadcaster, dissconnectHandler)
        this.disconnectHandler(broadcaster, dissconnectHandler)

        if(this.active){
            for(let broadcaster in this.broadcasters){
                this.broadcasters[broadcaster].emit('addPeer', {'socket_id': socket.id, 'should_create_offer': true, 'constrains': null, 'properties': null})
                this.spectator.emit('addPeer', {'socket_id': this.broadcasters[broadcaster].socket.id, 'should_create_offer': false, 'constrains': this.broadcasters[broadcaster].constrains, 'properties': null})
            }
        }
    }
    isOwner(id){
        return id == this.owner
    }
    isBroadcaster(id){
        return !this.isOwner(id)//return this.broadcasters.indexOf(id) != -1
    }
    addSocket(socket,constrains,peerId){
        this.triggerConnect(socket)
        if(!this.isOwner(peerId)){
            if(this.broadcasters_list.indexOf(peerId) != -1){
                console.log('Broadcaster alrady exits')
                return;
            }
            this.broadcasters_list.push(peerId)
            this.addBroadcaster(socket,constrains, peerId,()=>{
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