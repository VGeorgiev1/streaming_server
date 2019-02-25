import Room from './Room'
import * as fs from 'fs';
export default class SurvillianceRoom extends Room{
    constructor(name,ownerId,channel,io){
        super(name, 'surveillance',channel,io)
        this.broadcasterStreams = [] 
        this.spectator = {}
        this.broadcasters_list = []
        this.owner = ownerId
        this.active = false
    }
    addBroadcaster(socket, peerId, constrains,dissconnectHandler)
    {
        let broadcaster=this.setupConnection(socket,peerId,constrains,dissconnectHandler)
        this.broadcasterStreams.push(broadcaster)
        if(this.active){
            this.spectator.socket.emit('addPeer', {'socket_id': socket.id, 'should_create_offer': false, 'constrains': constrains})
            broadcaster.socket.emit('addPeer', {'socket_id': this.spectator.socket.id, 'should_create_offer': true, 'constrains': null})
        }
    }
    addSpectator(socket, peerId,dissconnectHandler){
        this.spectator=this.setupConnection(socket,peerId,null,dissconnectHandler)
        if(this.active){
            for(let broadcaster of this.broadcasterStreams){
                broadcaster.socket.emit('addPeer', {'socket_id': socket.id, 'should_create_offer': true, 'constrains': null})
                this.spectator.socket.emit('addPeer', {'socket_id': broadcaster.socket.id, 'should_create_offer': false, 'constrains': broadcaster.constrains})
            }
        }
    }
    isOwner(id){
        return id == this.owner
    }
    isBroadcaster(id){
        return !this.isOwner(id)//return this.broadcasters.indexOf(id) != -1
    }
    addSocket(socket,constrains,peerId){
        this.triggerConnect(socket)
        if(!this.isOwner(peerId)){
            if(this.broadcasters_list.indexOf(peerId) != -1){
                console.log('Broadcaster alrady exits')
                return;
            }
            this.broadcasters_list.push(peerId)
            this.addBroadcaster(socket,constrains, peerId,()=>{
                this.broadcasters_list.splice(this.broadcasters_list.indexOf(peerId),1)
            })
        }
        else{
            this.active = true;
            this.addSpectator(socket, peerId,()=>{
                this.active = false
            })
        }
        
    }
    
}