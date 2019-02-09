import Room from './Room'
import * as fs from 'fs';
export default class ConferentRoom extends Room{
    constructor(name,rules,ownerId){
        super(name, 'conferent')
        this.viewers = {}
        this.broadcasters = {}
        this.broadcasters_list = []
        this.owner = ownerId
        this.rules = rules
        this.active = false
    }
    addBroadcaster(socket, peerId, constrains,dissconnectHandler)
    {
        for(let id in this.connections){
            this.connections[id].socket.emit('addPeer', {'socket_id': socket.id, 'should_create_offer': false, 'constrains': constrains})
            socket.emit('addPeer', {'socket_id': id, 'should_create_offer': true, 'constrains': this.connections[id].constrains})
        }
        this.broadcasters_list.push(peerId)
        this.broadcasters[socket.id] = this.setup_connection(socket,peerId,constrains,dissconnectHandler)
    }
    addPeer(socket, peerId, constrains){
        for(let id in this.broadcasters){
            this.connections[id].socket.emit('addPeer', {'socket_id': socket.id, 'should_create_offer': true, 'constrains': constrains})
            socket.emit('addPeer', {'socket_id': id, 'should_create_offer': false, 'constrains': this.broadcaster[id].constrains})
        }
        this.viewers[socket.id] = this.setup_connection(socket,peerId,null);
    }
    isBroadcaster(id){
        return true//return this.broadcasters.indexOf(id) != -1
    }
    addSocket(socket,constrains,peerId){
        this.triggerConnect(socket)
        if(!this.isBroadcaster(peerId)){
            if(this.viewers.indexOf(peerId) != -1){
                console.log('Viewer alrady exits')
                return;
            }
            this.viewers.push(peerId)
            this.addPeer(socket, peerId)
        }
        else{
            this.active = true;
            console.log(this.active)
            this.addBroadcaster(socket, peerId, constrains,()=>{
                this.broadcasters_list.splice(this.broadcasters_list.indexOf(peerId),1)
                if(this.broadcasters_list.length == 0){
                    this.active = false
                }
            })
        }
        
    }
    
}