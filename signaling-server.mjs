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
import { WSAELOOP } from 'constants';
import pg from 'pg'
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/stream_app';
let client = new pg.Client(connectionString)
client.connect(()=>{
    client.query(
        'CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY, name VARCHAR(40) not null, password VARCHAR(20) not null)',
        (err,res)=>{
            if(err)
                console.log(err)
            console.log(res)
        }
    );
})

var app = express()
var server = http.createServer(app)
var rooms = {}
let io = new SocketIO(server);
rooms['Vladislav'] = new MultiOwnerRoom('Vladislav')


app.use("/public",express.static(path.join(path.resolve() + '/public')));

app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: true }))

server.listen(PORT, null, function() {
    console.log("Listening on port " + PORT);
});

app.get('/', (req, res)=>{
    res.render('home')
});
app.get('/room/create',(req, res)=>{
    res.render('create')
})
app.post('/room/create', (req,res)=>{
    rooms[req.body.name] = new MultiOwnerRoom(req.body.name)
    res.send("Room successfuly created!")
})
app.get('/room/list', (req,res)=>{
    res.render('list', {rooms: Object.keys(rooms)})
})
app.get('/room/:name',(req,res)=>{
    res.render('room', {name: req.params.name})
})
io.sockets.on('connection', function (socket) {
    socket.on('join', (data)=>{
        rooms[data.channel].addOwner(socket,data.constrains)
    })
})
