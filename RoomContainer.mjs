import Room from './Room.mjs'
import StreamingRoom from './StreamingRoom.mjs'
import ConferentRoom from './ConferentRoom.mjs'
export default class RoomContainer{
    constructor(server) {
        this.rooms = {}
    }
    where(options){
        let filtered = []
        if(Object.keys(options).length == 0){
            for(let room in this.rooms){
                filtered.push(this.rooms[room])
            }
        }else{
            for(let option in options){
                for(let room in this.rooms){
                    if(this.rooms[room][option] == options[option]){
                        filtered.push(this.rooms[room])
                    }
                }
            }
        }
        return filtered

    }

    subscribeSocket(socket){
        socket.on('getRules', (channel)=>{
            socket.emit('rules', this.rooms[channel].rules)
        })
        socket.on('join', (data)=>{
            if(!this.rooms[data.channel]) throw new Error("No such channel!")
            else{
                this.rooms[data.channel].addSocket(socket,data.constrains, data.id)
            }
        })
    }
    addRoom(roomObj){
        switch(roomObj.type){
            case 'conferent':
                            this.rooms[roomObj.id] = new ConferentRoom(roomObj.name,{audio: roomObj.audio, video: roomObj.video, screen: roomObj.screen} ,roomObj.owner)
                            break;
            case 'streaming':
                            this.rooms[roomObj.id] = new StreamingRoom(roomObj.name,roomObj.owner)
                            break;
        }
        return this.rooms[roomObj.id]
    }
    getRoom(id){
        return this.rooms[id]
    }
}