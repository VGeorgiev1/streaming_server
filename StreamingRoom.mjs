import Room from './Room'
import * as fs from 'fs';
export default class StreamingRoom extends Room{
    constructor(name, rules,ownerId){
        super(name, 'streaming')
        this.viewers = []
        this.broadcaster = {}
        this.rules = rules
        this.owner = ownerId
        this.active = false;
    }
    addSocket(socket,constrains,peerId){
        if(this.viewers.indexOf(peerId) != -1){
            console.log("Viewer already exists!")
        }
        else if(this.owner == peerId){
            this.active = true;
            this.addBroadcaster(socket,constrains,peerId, ()=>{
               this.active = false
            })
        }else{
            this.viewers.push(peerId)
            constrains = null
            this.addPeer(socket,constrains, peerId)
        }
        
    }
    addBroadcaster(socket, constrains, peerId, dissconnectHandler){
        for(let id in this.connections){
            this.connections[id].socket.emit('addPeer', {'socket_id': socket.id, 'should_create_offer': false, 'constrains': constrains})
            socket.emit('addPeer', {'socket_id': id, 'should_create_offer': true, 'constrains': this.connections[id].constrains})
        }
        this.connections[socket.id] = {}
        this.connections[socket.id].socket = socket;
        this.connections[socket.id].constrains = constrains
        this.connections[socket.id].userId = peerId
        this.broadcaster = this.connections[socket.id]
        this.handshakeHandlers(socket.id);
        this.connectDisconnectHandlers(socket.id, dissconnectHandler)
    }
    addPeer(socket,constrains,peerId, dissconnectHandler){
        if(this.connections[socket.id]){
            console.log('Peer already exist!');
        }
        this.connections[socket.id] = {}
        if(this.active){
            this.broadcaster.socket.emit('addPeer', {'socket_id': socket.id, 'should_create_offer': true, 'constrains': null})
            socket.emit('addPeer', {'socket_id': this.broadcaster.socket.id, 'should_create_offer': false, 'constrains': this.broadcaster.constrains})

        }
        this.connections[socket.id] = {}
        this.connections[socket.id].socket = socket;
        this.connections[socket.id].userId = peerId
        this.handshakeHandlers(socket.id);
        this.connectDisconnectHandlers(socket.id, dissconnectHandler)
    }
    isActive(){
        return this.active
    }
    isBroadcaster(id){
        return id == this.owner
    }
    
}