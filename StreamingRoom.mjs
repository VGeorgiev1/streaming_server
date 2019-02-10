import Room from './Room'
import * as fs from 'fs';
export default class StreamingRoom extends Room{
    constructor(name,ownerId){
        super(name, 'streaming')
        this.viewers = []
        this.broadcasterStreams = [] 
        this.owner = ownerId
        this.active = false;
        this.connectTriggers = []
        this.topics = []
    }
    addSocket(socket,constrains,peerId){
        this.triggerConnect(socket)
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
            this.addPeer(socket,constrains, peerId, (id)=>{
                this.viewers.splice(this.viewers.indexOf(peerId),1)
            })
        }
        
    }
    addBroadcaster(socket, constrains, peerId, dissconnectHandler){
        for(let id in this.connections){
            if(peerId != this.connections[id].userId){
                this.connections[id].socket.emit('addPeer', {'socket_id': socket.id, 'should_create_offer': false, 'constrains': constrains})
                
                socket.emit('addPeer', {'socket_id': id, 'should_create_offer': true, 'constrains': this.connections[id].constrains})
            }
        }
        let broadcaster = this.setup_connection(socket,peerId,constrains,dissconnectHandler)
        this.obHandler(broadcaster);
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
        let viewer=this.setup_connection(socket,peerId,constrains,dissconnectHandler)
    }
    isActive(){
        return this.active
    }
    isBroadcaster(id){
        return id == this.owner
    }
    
}