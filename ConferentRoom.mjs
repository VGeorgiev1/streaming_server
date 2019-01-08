import Room from './Room'
import * as fs from 'fs';
export default class ConferentRoom extends Room{
    constructor(name,rules,ownerId){
        super(name, 'conferent')
        this.viewers = []
        this.broadcasters = [ownerId]
        this.owner = ownerId
        this.rules = rules
        this.activated = false
    }
    addBroadcaster(id)
    {
        this.broadcasters.push(id)
    }
    isBroadcaster(id){
        return this.broadcasters.indexOf(id) != -1
    }
    addSocket(socket,constrains,peerId){
        if(!this.isBroadcaster()){
            if(this.viewers.indexOf(peerId) != -1){
                console.log('Viewer alrady exits')
                return;
            }
            this.viewers.push(peerId)
        }
        this.addPeer(socket,constrains)
    }
    
}