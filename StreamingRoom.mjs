import Room from './Room'
import * as fs from 'fs';
export default class StreamingRoom extends Room{
    constructor(name, rules,ownerId){
        super(name)
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
            console.log(this.owner, peerId)
            console.log('activate')
        }else{
            this.viewers.push(peerId)
            constrains = null
        }
        this.addPeer(socket,constrains, (disconnectSocket)=>{
            if(disconnectSocket.id == socket.id){
                this.active = false
            }
        })
    }
    isActive(){
        return this.active
    }
    isBroadcaster(id){
        return id == this.owner
    }
}