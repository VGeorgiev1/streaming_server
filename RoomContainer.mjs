import Room from './Room.mjs'
import StreamingRoom from './StreamingRoom.mjs'
import MultiBroadcasterRoom from './MultiBroadcasterRoom.mjs'
export default class RoomContainer{
    constructor(server) {
        this.rooms = {}

    }
    subscribeSocket(socket){
        socket.on('join', (data)=>{
            if(!this.rooms[data.channel]) throw new Error("No such channel!")
            else{
                this.rooms[data.channel].addSocket(socket,data.constrains, data.id)
            }
        })
    }
    addRoom(roomObj){
        
        switch(roomObj.type){
            case 'multiOwner':
                            this.rooms[roomObj.id] = new MultiBroadcasterRoom(roomObj.name,{audio: roomObj.audio, video: roomObj.video, screen: roomObj.screen} ,roomObj.owner)
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