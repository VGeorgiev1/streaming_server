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
var SALT_ROUNDS = 10
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }))
app.use("/public",express.static(path.join(path.resolve() + '/public')));

app.set('view engine', 'pug');

var loginware = function (req, res, next) {
    db.Session.findOne({where:{sessionToken: req.cookies.sessionToken}}).then((ses,err)=>{
        if(err)
            console.log(err)
        req.authenticated = false    
        if(ses){
            req.authenticated = true
        }
        next()
    })
}
app.use(loginware)
let room_container = new RoomContainer()
let db = new DbManager()
db.initializeTables(()=>{
    db.getAllRoomsAndRules().then((rooms,err)=>{
        if(err)
            console.log(err)
        for(let room of rooms){
            room_container.addRoom(room.dataValues)
        }
        server.listen(PORT, null, () => {
            console.log("Listening on port " + PORT);
        });
    })
})
app.get('/', async(req, res)=>{
    db.getAllRooms().then((rooms,err)=>{
        if(err)
            console.log(err)
        let dataValues = []
        for(let r of rooms){
            dataValues.push(r.dataValues)
        }
        let result = []
        let cont = dataValues.slice(0);
             while(cont[0]) { 
                 result.push(cont.splice(0, 3)); 
             }
        
        res.render('list', {"room_rows": result, "auth": req.authenticated})
    })
});
app.get('/room/create',(req, res)=>{
    if(!req.authenticated) {res.redirect('/login')}
    else{
        res.render('create', {auth: req.authenticated})
    }
})
app.post('/room/create', async (req,res)=>{
    if(!req.authenticated){res.redirect('/login')}
    else{
        db.getLoggedUser(req.cookies.sessionToken).then((ses,err)=>{
            let user_id = ses.dataValues.user.dataValues.id
            db.createRoom(user_id, req.body).then((room,err)=>{
                let room_id = room.dataValues.id
                room_container.addRoom({id:room_id,name:req.body.name,audio:req.body.audio, video:req.body.video, screen:req.body.screen,owner: user_id,type:req.body.type})
                res.redirect('/room/'+room_id)
            })
        })
    }
})
app.get('/room/list', async (req,res)=>{
    db.getAllRooms().then((rooms, err)=>{
        if(err)
            console.log(err)
            res.render('list', {"rooms": rooms, "auth": req.authenticated})
    })
})
app.get('/register', (req,res)=>{
    if(req.authenticated) {res.redirect('/')}
    else{
        res.render('register', {"auth": req.authenticated})
    }
})
app.post('/register', async(req,res)=>{
    let hash = await bcrypt.hash(req.body.password, SALT_ROUNDS)
    db.User.create({username: req.body.name, password: hash}).then((user,err)=>{
        if(err)
            console.log(err)
        if(user.dataValues.id){
            res.cookie('id', user.dataValues.id)
            res.redirect("/")
        }else{
            res.send("There is already a user with this username!")
        }
    })
})
app.get('/login', (req,res)=>{
    if(req.authenticated) {res.redirect('/')}
    else{
        res.render('login', {"auth": req.authenticated})
    }
})
app.get('/logout', async(req,res)=>{
    if(!req.authenticated){res.redirect('/')}
    else{
        db.destroySession(req.cookies.sessionToken).then(()=>{
            res.clearCookie("sessionToken");
            res.redirect('/')
        })
    }
})
app.get('/try', async(req,res)=>{
})
app.post('/login', async(req,res)=>{
    db.logUser(req.body).then((user,err)=>{
        if(user){
            let authenticated = bcrypt.compareSync(req.body.password, user.dataValues.password)
            if(authenticated){
                db.checkForSessionOrCreate(user.dataValues.id, crypto.randomBytes(10).toString("hex")).then((ses,err)=>{
                    res.cookie('sessionToken' , ses[0].dataValues.sessionToken).redirect('/')
                })
            }else{
                res.send("The password and username doesn't match!")
            }
        }else{
            res.send("There is no user with this username!")
        }
    })
})
app.get('/room/:id',async (req,res)=>{
    let room = room_container.getRoom(req.params.id.toString())
    if(!room){res.send("Rooms does not exists!");return}
    let userId;
    if(req.authenticated){
        db.getLoggedUser(req.cookies.sessionToken).then((ses,err)=>{
            if(err)
                console.log(err)
            userId = ses.dataValues.user.dataValues.id
            let isBroadcaster = room.isBroadcaster(userId)
            res.render('room', {channel: req.params.id, id: userId, isBroadcaster: isBroadcaster, auth: req.authenticated});
        })
    }else{
        userId = crypto.randomBytes(10).toString("hex")
        res.render('room', {channel: req.params.id, id: userId, isBroadcaster: false, auth: req.authenticated});
    }
})
io.sockets.on('connection', function (socket) {
    room_container.subscribeSocket(socket);
})