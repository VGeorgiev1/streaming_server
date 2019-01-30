export default class Chat{
    constructor(room){
        this.room = room
        room.onConnect((socket)=>{
           this.appendHandlers(socket)
        })
    }
    appendHandlers(socket){
        this.room.regHandler(socket,'sendMessage', (data)=>{
            let cons = this.room.getConnections()
            for(let con in cons){
                if(con != socket.id){
                    cons[con].socket.emit('recieveMessage',data)
                }
            }    
        })
    }
}