import Room from './Room'
import * as fs from 'fs';
export default class ConferentRoom extends Room{
    constructor(name,rules,ownerId,channel,io){
        super(name, 'conferent',channel,io)
        this.viewers = {}
        this.broadcasters = {}
        this.broadcasters_list = []
        this.owner = ownerId
        this.rules = rules
        this.active = false
    }
    addBroadcaster(socket, peerId, constrains,dissconnectHandler)
    {
        this.broadcasters_list.push(socket.id)
        this.broadcasters[socket.id] = this.setupConnection(socket,peerId,constrains,dissconnectHandler)
        for(let id in this.connections){
            if(peerId != this.connections[id].peerId){
                this.connections[id].socket.emit('addPeer', {'socket_id': socket.id, 'should_create_offer': false, 'constrains': constrains})
                socket.emit('addPeer', {'socket_id': id, 'should_create_offer': true, 'constrains': this.connections[id].constrains})
            }    
        }
    }
    addPeer(socket, peerId, constrains){
        this.viewers.push(peerId)
        this.viewers[socket.id] = this.setupConnection(socket,peerId,null);
        for(let id of this.broadcasters_list){
            this.connections[id].socket.emit('addPeer', {'socket_id': socket.id, 'should_create_offer': true, 'constrains': constrains})
            socket.emit('addPeer', {'socket_id': id, 'should_create_offer': false, 'constrains': this.broadcaster[id].constrains})
        }
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
            this.addPeer(socket, peerId)
        }
        else{
            this.active = true;
            this.addBroadcaster(socket, peerId, constrains,()=>{
                this.broadcasters_list.splice(this.broadcasters_list.indexOf(peerId),1)
                if(this.broadcasters_list.length == 0){
                    this.active = false
                }
            })
        }
        
    }
    
}