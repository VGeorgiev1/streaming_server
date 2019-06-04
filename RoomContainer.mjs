import Room from './Room.mjs'
import StreamingRoom from './StreamingRoom.mjs'
import ConferentRoom from './ConferentRoom.mjs'
import SurvillianceRoom from './SurvillianceRoom.mjs'

let MAX_TOPICS = 10;
import FilterManager from './Filters.mjs'

export default class RoomContainer{
    constructor(server) {
        this.rooms = {}
        this.filter_manager = new FilterManager()
    }
    where(options){
        let filtered = []
        if(Object.keys(options).length == 0){
            for(let room in this.rooms){
                filtered.push(this.rooms[room])
            }
            return filtered
        }
        
        this.filter_manager.applyOperator(options.operator, this.rooms, options)
        
        return this.filter_manager.getFiltered()
    }
    whereTopic(topic){
        let topics = topic.split(" ")
        let filtered = []
        for(let room in this.where({type:'streaming'})){
            let r;
            for(let topic of topics){
                r = this.rooms[room].topics.find(t=>t.class.includes(topic));
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
                                new ConferentRoom(roomObj.name,{audio: roomObj.audio, video: roomObj.video, screen: roomObj.screen} ,roomObj.owner,roomObj.channel, roomObj.broadcasters, roomObj.io)

                            break;
            case 'streaming':
                            this.rooms[roomObj.channel] = new StreamingRoom(roomObj.name,roomObj.owner,roomObj.channel,roomObj.io,{max_topics: MAX_TOPICS})
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