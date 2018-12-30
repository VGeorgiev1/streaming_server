import Room from './Room'
import * as fs from 'fs';
export default class MultiBroadcasterRoom extends Room{
    constructor(name,rules,ownerId){
        super(name)
        this.viewers = []
        this.broadcasters = []
        this.owner = ownerId
        this.rules = rules
        this.activated = false
    }
    addSocket(id,socket,constrains){
        if(this.viewers.indexOf(id) != -1)
            console.log("Viewer already exists!")
        this.addPeer(socket,constrains)
    }
}