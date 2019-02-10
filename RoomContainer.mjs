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
                filtered.push(this.getRoom(room))
            }
        }else{
            for(let option in options){
                for(let room in this.rooms){
                    if(this.rooms[room][option] == options[option]){
                        filtered.push(this.getRoom(room))
                    }
                }
            }
        }
        return filtered

    }
    whereTopic(topic){
        let topics = topic.split(" ")
        let filtered = []
        for(let room in this.rooms){
            let r;
            for(let topic of topics){
                if(this.rooms[room].topics){
                    r = this.rooms[room].topics.find(t =>t.includes(topic));
                }else{
                    break;
                }
            }
            if(r)
                filtered.push(this.rooms[room])
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
        if(this.rooms[id]){
          this.rooms[id].id = id
          return this.rooms[id]
        };
    }
}