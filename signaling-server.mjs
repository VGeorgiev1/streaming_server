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
import pug from 'pug'
import bodyParser from 'body-parser'
import DbManager from './db.mjs'
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/stream_app';
var app = express()
var server = http.createServer(app)
var rooms = {}
let io = new SocketIO(server);
const db = new DbManager(connectionString) 

rooms['Vladislav'] = new MultiOwnerRoom('Vladislav')


app.use("/public",express.static(path.join(path.resolve() + '/public')));

app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: true }))

server.listen(PORT, null, function() {
    console.log("Listening on port " + PORT);
    db.initializeTables()
});

app.get('/', (req, res)=>{
    res.render('home')
});
app.get('/room/create',(req, res)=>{
    res.render('create')
})
app.post('/room/create', async (req,res)=>{
    await db.createRoom(req.body)
    res.send('Room created!')
})
app.get('/room/list', async (req,res)=>{
    let rooms = await db.getAllRooms()
    res.render('list', {"rooms": rooms})
})
app.get('/room/:id',(req,res)=>{
    
})
io.sockets.on('connection', function (socket) {
    socket.on('join', (data)=>{
        rooms[data.channel].addOwner(socket,data.constrains)
    })
})
