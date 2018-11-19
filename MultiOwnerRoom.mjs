import Room from './Room'
import * as fs from 'fs';
export class MultiOwnerRoom extends Room{
    constructor(name, rules){
        super(name)
        console.log(typeof rules)
        this.owners = {};
        this.viewers = {};
        if(typeof rules == 'string'){
            
            this.rules = JSON.parse(fs.readFileSync(rules), "utf8")
            console.log(this.rules.owner_rules)
        }else{
           
            this.rules = rules
        }
    }
    addOwner(socket){
        if(socket in this.owners)
            console.log('Owner already exists!');
        this.owners[socket.id] = socket
    }
    addViewer(socket){
        if(socket in this.viewers)
        console.log('Viewer already exists!');
        this.viewers[socket.id] = viewers
    }
}
let room = new MultiOwnerRoom('mahrume', './OwnerRules.json');