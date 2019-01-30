import Room from './Room'
import * as fs from 'fs';
export default class ConferentRoom extends Room{
    constructor(name,rules,ownerId){
        super(name, 'conferent')
        this.viewers = {}
        this.broadcasters = {}
        this.broadcasters_list = [ownerId]
        this.owner = ownerId
        this.rules = rules
        this.activated = false
    }
    addBroadcaster(socket, peerId, constrains)
    {
        for(let id in this.connections){
            this.connections[id].socket.emit('addPeer', {'socket_id': socket.id, 'should_create_offer': false, 'constrains': constrains})
            socket.emit('addPeer', {'socket_id': id, 'should_create_offer': true, 'constrains': this.connections[id].constrains})
        }
        this.broadcasters[socket.id] = this.setup_connection(socket,peerId,constrains)
        this.handshakeHandlers(this.broadcasters[socket.id])
        this.connectDisconnectHandlers(this.broadcasters[socket.id])

    }
    addPeer(socket, peerId, constrains){
        for(let id in this.broadcasters){
            this.connections[id].socket.emit('addPeer', {'socket_id': socket.id, 'should_create_offer': true, 'constrains': constrains})
            socket.emit('addPeer', {'socket_id': id, 'should_create_offer': false, 'constrains': this.broadcaster[id].constrains})
        }
        this.viewers[socket.id] = this.setup_connection(socket,peerId,null);
        this.handshakeHandlers(this.broadcasters[socket.id])
        this.connectDisconnectHandlers(this.broadcasters[socket.id])
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
            this.addBroadcaster(socket, peerId, constrains)
        }
        
    }
    
}