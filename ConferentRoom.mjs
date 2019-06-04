import Room from './Room.mjs'
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
    addBroadcaster(socket, peerId, constrains,properties,disconnectHandler)
    {
        this.active_broadcasters.push(socket.id)
        let broadcaster = new Connection(socket, peerId, constrains, properties, disconnectHandler) 
        this.broadcasters[socket.id] = broadcaster
        this.addConnection(socket.id,broadcaster)
        
        this.connections.forEach((connection, id)=>{
            if(peerId != connection.peerId){
                connection.emit('addPeer', {'socket_id': socket.id, 'should_create_offer': false, 'constrains': constrains, 'properties': properties})
                socket.emit('addPeer', {'socket_id': id, 'should_create_offer': true, 'constrains': connection.constrains, 'properties': connection.properties})
            } 
        })
    }
    addPeer(socket, peerId, constrains, disconnectHandler){
        this.viewers_list.push(peerId)
        let viewer = new Connection(socket, peerId, null,null, disconnectHandler) 
        this.viewers[socket.id] = viewer
        this.addConnection(socket.id,viewer)

        for(let broadcaster in this.broadcasters){

            this.broadcasters[broadcaster].emit('addPeer', {'socket_id': socket.id, 'should_create_offer': true, 'constrains': constrains})
            socket.emit('addPeer', {'socket_id': this.broadcasters[broadcaster].socket.id, 'should_create_offer': false, 'constrains':  this.broadcasters[broadcaster].constrains})
        }
    }
    isBroadcaster(id){
        return this.broadcasters_list.indexOf(id) != -1
    }
    addBroadcasterId(id){
        this.broadcasters_list.push(id)
    }
    removeBroadcasterId(id){
        this.broadcasters_list.splice(this.broadcasters_list.indexOf(id),1)
    }
    addSocket(socket,constrains,peerId,properties){
        this.triggerConnect(socket)
        if(!this.isBroadcaster(peerId)){
            console.log(peerId)
            if(this.viewers_list.indexOf(peerId) != -1){
                console.log('Viewer already exists')
                return;
            }
            this.addPeer(socket, peerId,null, ()=>{
                this.viewers_list.splice(this.viewers_list.indexOf(peerId),1)
            })
        }
        else{
            console.log(peerId)
            if(this.active_broadcasters.indexOf(peerId) != -1){
                console.log('Broadcaster already exists')
                return;
            }
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