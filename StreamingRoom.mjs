import Room from './Room'
import * as fs from 'fs';
export default class StreamingRoom extends Room{
    constructor(name,ownerId,channel,io){
        super(name, 'streaming',channel,io)
        this.viewers = []
        this.broadcasterStreams = [] 
        this.owner = ownerId
        this.active = false;
        this.topics = []
    }
    addBroadcaster(socket, constrains, peerId, dissconnectHandler){
        let broadcaster = this.setupConnection(socket,peerId,constrains,dissconnectHandler)
        this.obHandler(broadcaster);
        this.broadcasterStreams.push(broadcaster)
        for(let id in this.connections){
            if(peerId != this.connections[id].peerId){
                this.connections[id].socket.emit('addPeer', {'socket_id': socket.id, 'should_create_offer': false, 'constrains': constrains})
                broadcaster.socket.emit('addPeer', {'socket_id': id, 'should_create_offer': true, 'constrains': this.connections[id].constrains})
            }
        }
    }
    
    addViewer(socket,constrains,peerId, dissconnectHandler){
        let viewer=this.setupConnection(socket,peerId,constrains,dissconnectHandler)
        if(this.active){
            for(let broadcaster of this.broadcasterStreams){
                broadcaster.socket.emit('addPeer', {'socket_id': socket.id, 'should_create_offer': true, 'constrains': null})
                viewer.socket.emit('addPeer', {'socket_id': broadcaster.socket.id, 'should_create_offer': false, 'constrains': broadcaster.constrains})
            }    
        }
    }
    addSocket(socket,constrains,peerId){
        this.triggerConnect(socket)
        if(this.isBroadcaster(peerId) ){
            if(this.active == true){
                console.log("Room already activated!")
                return;
            }
            
            this.active = true;
            this.addBroadcaster(socket,constrains,peerId, ()=>{
                this.active = false
            })
        }else{
            if(this.viewers.indexOf(peerId) != -1){
                console.log("Viewer already exists!")
                return;
            }
            this.viewers.push(peerId)
            constrains = null
            this.addViewer(socket,constrains, peerId, (id)=>{
                this.viewers.splice(this.viewers.indexOf(peerId),1)
            })
        }
        
    }
    isActive(){
        return this.active
    }
    isBroadcaster(id){
        return id == this.owner
    }
    
}