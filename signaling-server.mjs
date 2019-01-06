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
import path from 'path';
import pug from 'pug'
import bodyParser from 'body-parser'
import DbManager from './db.mjs'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'
import RoomContainer from './RoomContainer.mjs'
import Room from './Room.mjs';

import crypto from 'crypto'
const connectionString =  process.env.DATABASE_URL || 'postgres://localhost:5432/stream_app';
var app = express()
var server = http.createServer(app)
var roomsContainer = []
let io = new SocketIO(server);
const db = new DbManager(connectionString, connectionString == process.env.DATABASE_URL) 
var SALT_ROUNDS = 10
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }))
app.use("/public",express.static(path.join(path.resolve() + '/public')));

app.set('view engine', 'pug');

var loginware = function (req, res, next) {
    db.findSession(req.cookies.sessionToken).then((ses)=>{
        if(ses){
            req.authenticated = true
        }
        next()
    })
}
app.use(loginware)
let room_container = new RoomContainer()
db.initializeTables().then(() => {
    db.getAllRoomsAndRules().then((rooms) => {
        rooms.forEach(room => {
           room_container.addRoom(room)
        });
        server.listen(PORT, null, () => {
            console.log("Listening on port " + PORT);
        });
    })
})
app.get('/', async(req, res)=>{
    let rooms = await db.getAllRooms()
    //let rules = await db.getRules(rooms[0].rulesid)
    res.render('list', {"rooms": rooms})
});
app.get('/room/create',(req, res)=>{
    if(!req.authenticated) {res.redirect('/login')}
    else{
        res.render('create')
    }
})
app.post('/room/create', async (req,res)=>{
    if(!req.authenticated){res.redirect('/login')}
    else{
        let userId = await db.getLoggedUser(req.cookies.sessionToken)
        let id = await db.createRoom(userId,req.body)
        room_container.addRoom({id:id,name:req.body.name,audio:req.body.audio, video:req.body.video, screen:req.body.screen,owner: userId,type:req.body.type})
        res.redirect('/room/'+id)
    }
})
app.get('/room/list', async (req,res)=>{
    let rooms = await db.getAllRooms()
    let rules = await db.getRules(rooms[0].rulesid)
    res.render('list', {"rooms": rooms})
})
app.get('/register', (req,res)=>{
    if(req.authenticated) {res.redirect('/')}
    else{
        res.render('register')
    }
})
app.post('/register', async(req,res)=>{
    let hash = await bcrypt.hash(req.body.password, SALT_ROUNDS)
    let id = await db.registerUser(req.body.name, hash)
    if(id){
        res.cookie('id', id)
        res.send("You are now registered!")
    }else{
        res.send("There is already a user with this username!")
    }
})
app.get('/login', (req,res)=>{
    if(req.authenticated) {res.redirect('/')}
    else{
        res.render('login')
    }
})
app.get('/logout', async(req,res)=>{
    if(!req.authenticated){res.redirect('/')}
    else{
        await db.destroySession(req.cookies['sessionToken'])
        res.clearCookie("sessionToken");
        res.send('Logout!')
    }
})
app.get('/try', async(req,res)=>{
})
app.post('/login', async(req,res)=>{
    let user = await db.logUser(req.body)
    if(user){
        let authenticated = bcrypt.compareSync(req.body.password, user.password)
        if(authenticated){
            let token = await db.checkForSessionOrCreate(user.id)
            res.cookie('sessionToken' , token).send("Hello in "+ user.username)
        }else{
            res.send("The password and username doesn't match!")
        }
    }else{
        res.send("There is no user with this username!")
    }
})
app.get('/room/:id',async (req,res)=>{
    let room = room_container.getRoom(req.params.id.toString())
    
    if(!room){res.send("Rooms does not exists!")}
    let userId;
    if(req.authenticated){
        userId = await db.getLoggedUser(req.cookies.sessionToken)
        
    }else{
        userId = crypto.randomBytes(10).toString("hex")
    }
    let isOwner = room.isBroadcaster(userId)
   
    res.render('room', {channel: req.params.id, id: userId, isOwner: isOwner});
})
io.sockets.on('connection', function (socket) {
    room_container.subscribeSocket(socket);
})
