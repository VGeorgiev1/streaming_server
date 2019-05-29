import Room from './Room.mjs'
import * as fs from 'fs';
import Connection from './Connection.mjs'
export default class ConferentRoom extends Room{
    constructor(name,rules,ownerId,channel,io){
        super(name, 'conferent',channel,io)
        this.viewers = {}
        this.broadcasters = {}
        this.broadcasters_list = []
        this.viewers_list = []
        this.owner = ownerId
        this.rules = rules
        this.active = false
        this.setupStartHandlers()
    }
    addBroadcaster(socket, peerId, constrains,properties,dissconnectHandler)
    {
        this.broadcasters_list.push(socket.id)
        let broadcaster = new Connection(socket, peerId, constrains, properties, dissconnectHandler) 
        this.broadcasters[socket.id] = broadcaster
        this.addConnection(socket.id,broadcaster)
        this.attachHandlers(broadcaster, dissconnectHandler)

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
        this.attachHandlers(viewer, dissconnectHandler)
        for(let id of this.broadcasters_list){
            this.connections.get(id).emit('addPeer', {'socket_id': socket.id, 'should_create_offer': true, 'constrains': constrains})
            socket.emit('addPeer', {'socket_id': id, 'should_create_offer': false, 'constrains':  this.connections.get(id).constrains})
        }
    }
    isBroadcaster(id){
        return true//return this.broadcasters.indexOf(id) != -1
    }
    addSocket(socket,constrains,peerId,properties){
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
            this.addBroadcaster(socket, peerId, constrains,properties,()=>{
                this.broadcasters_list.splice(this.broadcasters_list.indexOf(peerId),1)
                if(this.broadcasters_list.length == 0){
                    this.active = false
                }
            })
        }
        
    }
    
}