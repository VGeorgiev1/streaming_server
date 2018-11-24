/**************/
/*** CONFIG ***/
/**************/
var PORT = process.env.PORT || 3000;


/*************/
/*** SETUP ***/
/*************/
import express from 'express' 
import * as http from 'http';
import SocketIO from 'socket.io';
import MultiOwnerRoom from "./MultiOwnerRoom"
import path from 'path';


var main = express()



var server = http.createServer(main)

let io = new SocketIO(server);


main.use("/public",express.static(path.join(path.resolve() + '/public')));


server.listen(PORT, null, function() {
    console.log("Listening on port " + PORT);
});
var public_room = new MultiOwnerRoom("my rooms");

main.get('/', function(req, res){
    res.sendFile(path.join(path.resolve() + '/client.html')) 
});

io.sockets.on('connection', function (socket) {
    socket.on('join', (data)=>{
        public_room.addOwner(socket,data);
    })
})
