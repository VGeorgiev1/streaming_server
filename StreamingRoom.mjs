import Room from './Room'
import * as fs from 'fs';
export default class StreamingRoom extends Room{
    constructor(name, rules,ownerId){
        super(name, 'streaming')
        this.viewers = []
        this.broadcasterStreams = [] 
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
            console.log(peerId)
            this.viewers.push(peerId)
            constrains = null
            this.addPeer(socket,constrains, peerId)
        }
        
    }
    addBroadcaster(socket, constrains, peerId, dissconnectHandler){
        console.log(peerId)
        for(let id in this.connections){
            if(peerId != this.connections[id].userId){
                this.connections[id].socket.emit('addPeer', {'socket_id': socket.id, 'should_create_offer': false, 'constrains': constrains})
                socket.emit('addPeer', {'socket_id': id, 'should_create_offer': true, 'constrains': this.connections[id].constrains})
            }
        }
        let broadcaster = this.setup_connection(socket,peerId,constrains)
        this.handshakeHandlers(broadcaster);
        this.obHandler(broadcaster);
        this.connectDisconnectHandlers(broadcaster, dissconnectHandler)
        this.broadcasterStreams.push(broadcaster)
    }
    
    addPeer(socket,constrains,peerId, dissconnectHandler){
       
        if(this.connections[socket.id]){
            console.log('Peer already exist!');
        }
        this.connections[socket.id] = {}
        if(this.active){
            for(let broadcaster of this.broadcasterStreams){
                broadcaster.socket.emit('addPeer', {'socket_id': socket.id, 'should_create_offer': true, 'constrains': null})
                socket.emit('addPeer', {'socket_id': broadcaster.socket.id, 'should_create_offer': false, 'constrains': broadcaster.constrains})
            }    
        }
        let connection = this.setup_connection(socket,peerId,constrains)
        this.handshakeHandlers(connection);
        this.connectDisconnectHandlers(connection, dissconnectHandler)
    }
    isActive(){
        return this.active
    }
    isBroadcaster(id){
        
        return id == this.owner
    }
    
}