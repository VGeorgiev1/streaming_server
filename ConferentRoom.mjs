import Room from './Room.mjs'
import * as fs from 'fs';
import Connection from './Connection.mjs'
export default class ConferentRoom extends Room{
    constructor(name,rules,ownerId,channel,broadcasters,io){
        super(name, 'conferent',channel,io)
        this.viewers = {}
        this.broadcasters = {}
        this.broadcasters_list = broadcasters
        this.active_broadcasters = []
        this.viewers_list = []
        this.owner = ownerId
        this.rules = rules
        this.active = false
        this.setupStartHandlers()
    }
    addBroadcaster(socket, peerId, constrains,properties,dissconnectHandler)
    {
        this.active_broadcasters.push(socket.id)
        let broadcaster = new Connection(socket, peerId, constrains, properties, dissconnectHandler) 
        this.broadcasters[socket.id] = broadcaster
        this.addConnection(socket.id,broadcaster)
        
        this.connections.forEach((connection, id)=>{
            if(peerId != this.connections.get(id).peerId){
                this.connections.get(id).emit('addPeer', {'socket_id': socket.id, 'should_create_offer': false, 'constrains': constrains, 'properties': properties})
                socket.emit('addPeer', {'socket_id': id, 'should_create_offer': true, 'constrains': this.connections.get(id).constrains, 'properties': this.connections.get(id).properties})
            } 
        })
    }
    addPeer(socket, peerId, constrains, dissconnectHandler){
        this.viewers_list.push(peerId)
        let viewer = new Connection(socket, peerId, null, dissconnectHandler) 
        this.viewers[socket.id] = viewer
        this.addConnection(socket.id,viewer)
        for(let id of this.active_broadcasters){
            this.connections.get(id).emit('addPeer', {'socket_id': socket.id, 'should_create_offer': true, 'constrains': constrains})
            socket.emit('addPeer', {'socket_id': id, 'should_create_offer': false, 'constrains':  this.connections.get(id).constrains})
        }
    }
    isBroadcaster(id){
        return this.broadcasters_list.indexOf(id) != -1
    }
    addBroadcasterId(id){
        this.broadcasters_list.push(id)
    }
    addSocket(socket,constrains,peerId,properties){
        this.triggerConnect(socket)
        if(!this.isBroadcaster(peerId)){
            if(this.viewers_list.indexOf(peerId) != -1){
                console.log('Viewer alrady exits')
                return;
            }
            this.addPeer(socket, peerId)
        }
        else{
            this.active = true;
            this.addBroadcaster(socket, peerId, constrains,properties,()=>{
                this.active_broadcasters.splice(this.active_broadcasters.indexOf(peerId),1)
                if(this.active_broadcasters.length == 0){
                    this.active = false
                }
            })
        }
        
    }
    
}