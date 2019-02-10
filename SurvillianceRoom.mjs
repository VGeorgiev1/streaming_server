import Room from './Room'
import * as fs from 'fs';
export default class ConferentRoom extends Room{
    constructor(name,rules,ownerId){
        super(name, 'survilience')
        this.broadcasters = {}
        this.spectator = {}
        this.broadcasters_list = []
        this.owner = ownerId
    }
    addBroadcaster(socket, peerId, constrains,dissconnectHandler)
    {
        this.broadcasters_list.push(peerId)
        this.broadcasters[socket.id] = this.setup_connection(socket,peerId,constrains,dissconnectHandler)
    }
    addSpectator(socket, peerId,dissconnectHandler){
        for(let id in this.broadcasters){
            this.connections[id].socket.emit('addPeer', {'socket_id': socket.id, 'should_create_offer': true, 'constrains': constrains})
            socket.emit('addPeer', {'socket_id': id, 'should_create_offer': false, 'constrains': this.broadcaster[id].constrains})
        }
        this.viewers[socket.id] = this.setup_connection(socket,peerId,null);
    }
    isOwner(id){
        return id == this.owner
    }
    isBroadcaster(id){
        return true //return this.broadcasters.indexOf(id) != -1
    }
    addSocket(socket,constrains,peerId){
        this.triggerConnect(socket)
        if(!this.isOwner(peerId)){
            if(this.broadcasters_list.indexOf(peerId) != -1){
                console.log('Broadcaster alrady exits')
                return;
            }
            this.broadcasters_list.push(peerId)
            this.addPeer(socket, peerId)
        }
        else{
            this.active = true;
            this.addSpectator(socket, peerId,()=>{
                this.broadcasters_list.splice(this.broadcasters_list.indexOf(peerId),1)
                if(this.broadcasters_list.length == 0){
                    this.active = false
                }
            })
        }
        
    }
    
}