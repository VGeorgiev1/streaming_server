import Room from './Room.mjs'
import StreamingRoom from './StreamingRoom.mjs'
import ConferentRoom from './ConferentRoom.mjs'
export default class RoomContainer{
    constructor(server) {
        this.rooms = {}
    }
    subscribeSocket(socket){
        socket.on('getRules', (channel)=>{
            socket.emit('rules', this.rooms[channel].rules)
        })
        socket.on('join', (data)=>{
            if(!this.rooms[data.channel]) throw new Error("No such channel!")
            else{
                console.log(socket.id)
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
                            this.rooms[roomObj.id] = new StreamingRoom(roomObj.name,{audio: roomObj.audio, video: roomObj.video, screen: roomObj.screen} ,roomObj.owner)
                            break;
        }
    }
    getRoom(id){
        return this.rooms[id]
    }
}