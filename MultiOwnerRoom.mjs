import Room from './Room'
import * as fs from 'fs';
export default class MultiOwnerRoom extends Room{
    constructor(name, rules){
        super(name)
        this.viewers = []
        this.owners = []    
        if(typeof rules == 'string'){
            this.rules = JSON.parse(fs.readFileSync(rules), "utf8")
            console.log(this.rules.owner_rules)
        }else{
            this.rules = rules
        }
    }
    addOwner(socket,data){
        if(this.owners.indexOf(socket.id) != -1)
            console.log("Owner already exists!")
        this.addPeer(socket,data)
    }
    addViewer(socket,data){
        if(this.viewers.indexOf(socket.id) != -1)
            console.log("Owner already exists!")
        this.addPeer(socket,data)
    }
    
}
let room = new MultiOwnerRoom('mahrume', './OwnerRules.json');