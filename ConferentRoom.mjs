import Room from './Room'
import * as fs from 'fs';
export default class ConferentRoom extends Room{
    constructor(name,rules,ownerId){
        super(name, 'conferent')
        this.viewers = []
        this.broadcasters = []
        this.owner = ownerId
        this.rules = rules
        this.activated = false
    }
    addSocket(socket,constrains,peerId){
        if(this.viewers.indexOf(peerId) != -1)
            console.log("Viewer already exists!")
        this.addPeer(socket,constrains)
    }
}