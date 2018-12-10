import Room from './Room'
import * as fs from 'fs';
export default class MultiOwnerRoom extends Room{
    constructor(name, rules){
        super(name)
        this.viewers = []
        this.owners = []    
        if(typeof rules == 'string'){
            this.rules = JSON.parse(fs.readFileSync(rules), "utf8")
        }else{
            this.rules = rules
        }
    }
    addOwner(socket,constrains){
        if(this.owners.indexOf(socket.id) != -1)
            console.log("Owner already exists!")
        this.addPeer(socket,constrains)
    }
    addViewer(socket,constrains){
        if(this.viewers.indexOf(socket.id) != -1)
            console.log("Owner already exists!")
        this.addPeer(socket,constrains)
    }
    
}
let room = new MultiOwnerRoom('mahrume', './OwnerRules.json');