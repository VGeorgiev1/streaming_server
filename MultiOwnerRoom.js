import Room from './Room'
import * as fs from 'fs';
export class MultiOwnerRoom extends Room{
    constructor(name, rules){
        super(name)
        this.owners = {};
        if(typeof rules === 'string'){
            this.rules = JSON.parse(fs.readFileSync(rules), "utf8")
        }else{
            this.rules = rules
        }
    }
    addOwner(socket){
        if(connection in this.owners)
            console.log('Owner already exists!');
        this.owners[socket.id] = socket
    }
    

}