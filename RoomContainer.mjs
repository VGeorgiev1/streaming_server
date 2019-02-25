import Room from './Room.mjs'
import StreamingRoom from './StreamingRoom.mjs'
import ConferentRoom from './ConferentRoom.mjs'
import SurvillianceRoom from './SurvillianceRoom.mjs'
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
    whereTopic(topic){
        let topics = topic.split(" ")
        let filtered = []
        for(let room in this.rooms){
            let r;
            for(let topic of topics){
                if(this.rooms[room].topics){
                    r = this.rooms[room].topics.find(t=>t.class.includes(topic));
                }else{
                    break;
                }
            }
            if(r)
                filtered.push(this.rooms[room])
        }
        return filtered
    }
    addRoom(roomObj){
        switch(roomObj.type){
            case 'conferent':
                            this.rooms[roomObj.channel] = 
                                new ConferentRoom(roomObj.name,{audio: roomObj.audio, video: roomObj.video, screen: roomObj.screen} ,roomObj.owner,roomObj.channel, roomObj.io)
                            break;
            case 'streaming':
                            this.rooms[roomObj.channel] = new StreamingRoom(roomObj.name,roomObj.owner,roomObj.channel,roomObj.io)
                            break;
            case 'surveillance':
                            this.rooms[roomObj.channel] = new SurvillianceRoom(roomObj.name,roomObj.owner,roomObj.channel,roomObj.io)
                            break;
        }
        return this.rooms[roomObj.channel]
    }
    getRoom(id){
        if(this.rooms[id]){
          this.rooms[id].id = id
          return this.rooms[id]
        };
    }
}