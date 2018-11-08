/**************/
/*** CONFIG ***/
/**************/
var PORT = process.env.PORT || 3000;


/*************/
/*** SETUP ***/
/*************/
var express = require('express');
var http = require('http');
var bodyParser = require('body-parser')
var main = express()
var io  = require('socket.io').listen(server);
var PublicRoom = require('./PublicRoom.js')
main.use("/public",express.static(__dirname + '/public'));

var server = http.createServer(main)
var io  = require('socket.io').listen(server);
//io.set('log level', 2);
server.listen(PORT, null, function() {
    console.log("Listening on port " + PORT);
});
var public_room = new PublicRoom("my rooms");
main.get('/', function(req, res){ res.sendFile(__dirname + '/client.html'); });
// main.get('/index.html', function(req, res){ res.sendfile('newclient.html'); });
// main.get('/client.html', function(req, res){ res.sendfile('newclient.html'); });
io.sockets.on('connection', function (socket) {
    socket.on('join', (userdata)=>{
        public_room.addPeer(socket,userdata);
    })    
})
