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
    addPeer(socket,constrains,peerId){
        if(this.viewers.indexOf(peerId) != -1){
            console.log("Viewer already exists!")
        }
        else if(this.owner = peerId){
            this.active = true;
        }
        else{
            this.viewers.push(peerId)
        }
        this.addPeer(socket,constrains)
    }
    isActive(){
        return this.active
    }
}