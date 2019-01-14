import Room from './Room'
import * as fs from 'fs';
export default class StreamingRoom extends Room{
    constructor(name, rules,ownerId){
        super(name, 'streaming')
        this.viewers = []
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
            this.connections[id].socket.emit('addPeer', {'peer_id': this.owner, 'should_create_offer': false, 'constrains': constrains})
            socket.emit('addPeer', {'peer_id': id, 'should_create_offer': true, 'constrains': this.connections[id].constrains})
        }
        this.connections[this.owner] = {}
        this.connections[this.owner].socket = socket;
        this.connections[this.owner].constrains = constrains;
        this.handshakeHandlers(peerId);
        this.connectDisconnectHandlers(peerId, dissconnectHandler)
    }
    addPeer(socket,constrains,peerId, dissconnectHandler){
        if(this.connections[peerId]){
            console.log('Peer already exist!');
        }
        this.connections[peerId] = {}
        if(this.connections[this.owner]){
            this.connections[this.owner].socket.emit('addPeer', {peer_id: peerId, 'should_create_offer': true, 'constrains': null})
            socket.emit('addPeer', {peer_id: this.owner, 'should_create_offer': false, 'constrains': this.connections[this.owner].constrains})
        }
        this.connections[peerId] = {}
        this.connections[peerId].socket = socket;
        this.handshakeHandlers(peerId);
        this.connectDisconnectHandlers(peerId, dissconnectHandler)
    }
    isActive(){
        return this.active
    }
    isBroadcaster(id){
        return id == this.owner
    }
    
}