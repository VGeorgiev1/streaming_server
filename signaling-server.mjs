
var PORT = process.env.PORT || 3000;


import express from 'express' 
import * as http from 'http';
import SocketIO from 'socket.io';
import path from 'path';
import pug from 'pug'
import bodyParser from 'body-parser'
import DbManager from './db.mjs'
import bcrypt from 'bcryptjs'
import cookieParser from 'cookie-parser'
import RoomContainer from './RoomContainer.mjs'
import Room from './Room.mjs';
import crypto from 'crypto'
import Chat from './Chat.mjs'
import cookie from 'cookie'


const connectionString =  process.env.DATABASE_URL || 'postgres://localhost:5432/stream_app';
var app = express()
var server = http.createServer(app)
var roomsContainer = []
let io = new SocketIO(server);
var SALT_ROUNDS = 10
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());

app.use("/public",express.static(path.join(path.resolve() + '/public')));

app.set('view engine', 'pug');
process.on('unhandledRejection', (reason, p) => {
    console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason);
});
var loginware = function (req, res, next) {
    if(req.cookies.sessionToken){
        db.findSession(req.cookies.sessionToken).then((ses,err)=>{
            if(err)
                console.log(err)
            req.authenticated = false
            if(ses){
                db.logUser({name: ses.dataValues.user.dataValues.username}, ()=>{
                    req.authenticated = true
                    req.userId = ses.userId
                    req.secret = ses.dataValues.user.dataValues.secret
                    req.username = ses.dataValues.user.dataValues.username
                    next()
                })
            }else{
                next()
            }
        })  
    }else{
        next();
    }
}
app.use(loginware)

let room_container = new RoomContainer()
let call_container = new RoomContainer()

let chat_container = []
let notify_sockets = {}

const db = new DbManager()


db.initializeTables(()=>{
    db.getAllRoomsAndRules().then((rooms,err)=>{
        if(err)
            console.log(err)
        for(let room of rooms){
            let options = {
                type: room.dataValues.type,
                id:room.dataValues.id,
                name:room.dataValues.name,
                owner: room.dataValues.owned_by.secret,
                channel:room.dataValues.channel,
                io: io
            }
            if(room.rule){
                options.audio = room.rule.dataValues.audio
                options.video = room.rule.dataValues.video
                options.screen = room.rule.dataValues.screen
                let broadcasters = []
                broadcasters.push(room.dataValues.owned_by.secret)
                db.getFriends(room.dataValues.owned_by.id).then((users, err)=>{
                    for(let row of users){
                        if(room.dataValues.owned_by.id == row.userId){
                            broadcasters.push(row.friend.dataValues.secret)
                        }else{
                            broadcasters.push(row.user.dataValues.secret)
                        }
                    }
                    options.broadcasters = broadcasters
                    chat_container.push(new Chat(room_container.addRoom(options)))
                })
            }else{
                chat_container.push(new Chat(room_container.addRoom(options)))
            }
        }
        server.listen(PORT, null, () => {
            console.log("Listening on port " + PORT);
        });
    })
})
function OneDToTwoD(array,lenght){
    let result = []
    let cont = array.slice(0);
    while(cont[0]) { 
             result.push(cont.splice(0, lenght)); 
    }
    return result
};

app.get('/', async(req, res)=>{
    let payload = room_container.where({})
    for(let room of payload){
        let user = await db.User.findOne({where:{secret: room.owner}})
        if(user)
            room.username = user.dataValues.username

    }
    res.render("list", {room_rows: OneDToTwoD(payload,3), auth: req.authenticated, user: req.username})
    
});
app.get('/room/create',(req, res)=>{
    if(!req.authenticated) {res.redirect('/login')}
    else{
        res.render('create', {auth: req.authenticated, user: req.username})
    }
})
app.post('/accept', (req, res)=>{
    if(req.userId != req.body.id){
        db.Friends.findOne({where:{userId: Math.min(req.userId, req.body.id), friendId: Math.max(req.userId, req.body.id)}})
            .then((row)=>{
                row.update({status: 'friends'}, {fields: ['status']})
                db.User.findOne({where:{id: req.body.id}}).then((user,err)=>{
                    if(err)
                        console.log(err)
                    
                    for(let room of room_container.where({owner: req.secret}).and({type: 'conferent'}).collect()){
                        room.addBroadcasterId(user.dataValues.secret)
                    }
                    for(let room of room_container.where({owner: user.dataValues.secret}).and({type: 'conferent'}).collect()){
                        room.addBroadcasterId(req.secret)
                    }
                })
                res.send('ok')           
            })
    }
})
app.post('/remove', (req,res)=>{
    db.removeFriend(req.userId,req.body.id).then((result)=>{
        db.User.findOne({where:{id: req.body.id}}).then((user,err)=>{
            if(err)
                console.log(err)
            
            for(let room of room_container.where({owner: req.secret}).and({type: 'conferent'}).collect()){
                room.removeBroadcasterId(user.dataValues.secret)
            }
            for(let room of room_container.where({owner: user.dataValues.secret}).and({type: 'conferent'}).collect()){
                room.removeBroadcasterId(req.secret)
            }
        })
        res.send("removed")
    })
})
app.get('/search', async(req,res)=>{
    let topic= req.query.topic
    let payload = room_container.whereTopic(topic).collect()
    for(let room of payload){
        let user = await db.User.findOne({where:{secret: room.owner}})
        room.username = user.dataValues.username
    }
    res.render("list", {room_rows: OneDToTwoD(payload,3), auth: req.authenticated, user: req.username})
})
app.post('/search', (req,res)=>{
    db.findUserByUsername(req.body.username).then(async (users,err)=>{
            let dataValues = []
            for(let user of users){
                if(user.dataValues.id != req.userId){
                    let row = await db.findFriend(user.dataValues.id, req.userId)
                    if(row != null){
                        if(req.userId == row.userId){
                            dataValues.push({id: row.friend.dataValues.id, username: row.friend.dataValues.username, status:row.status})
                        }else{
                            dataValues.push({id: row.user.dataValues.id, username: row.user.dataValues.username, status: row.status == 'friends' ? row.status: row.status == 'invite' ? 'request': 'invite'})
                        }
                    }else{
                        dataValues.push({id: user.dataValues.id, username: user.dataValues.username, status:'not_affiliated'})
                    }
                }
            }
            res.send(OneDToTwoD(dataValues, 3))
    })
})
app.get('/people', (req, res)=>{
    if(!req.authenticated) {res.redirect('/login')}
    else{
    db.getFriends(req.userId).then((users, err)=>{
            let dataValues = []
            for(let row of users){
                if(req.userId == row.userId){
                    dataValues.push({online:row.friend.dataValues.online, id: row.friend.dataValues.id, username: row.friend.dataValues.username, status:row.status})
                }else{
                    dataValues.push({online:row.user.dataValues.online, id: row.user.dataValues.id, username: row.user.dataValues.username, status: row.status == 'friends' ? row.status: row.status == 'invite' ? 'request': 'invite'})
                }
            }
            res.render('people',{people_list:OneDToTwoD(dataValues, 3), auth: req.authenticated, user: req.username})
        })
    }
})
function prepareReqeustQuery(id1,id2){
    return id1 < id2 ? {userId: id1, friendId: id2, status:'invite'} : {userId: id2, friendId: id1, status:'request'}
}
app.post('/sendrequest', (req,res)=>{
    let otherId = Number(req.body.id)
    db.Friends.create(prepareReqeustQuery(req.userId, otherId)).then(err=>{
        res.send('ok')
    })
})
app.post('/room/create', async (req,res)=>{
    if(!req.authenticated){res.redirect('/login')}
    else{
        let user_id = req.userId
        db.createRoom(user_id, req.body,(room,err)=>{
            let roomObj = {
                id:room.dataValues.id,
                name:room.dataValues.name,
                owner: req.secret,
                type:req.body.type,
                channel:room.dataValues.channel,
                io: io
            }            
            if(req.body.type == 'conferent'){
                let broadcasters = []
                db.User.findOne({where: {id: room.dataValues.owner}}).then((user)=>{
                    broadcasters.push(user.dataValues.secret);
                    
                    db.getFriends(user.dataValues.id).then((users, err)=>{
                        for(let row of users){
                            if(user.dataValues.id == row.userId){
                                broadcasters.push(row.friend.dataValues.secret)
                            }else{
                                broadcasters.push(row.user.dataValues.secret)
                            }
                        }
                        roomObj.broadcasters = broadcasters
                        for(let option of req.body.option){
                            roomObj[option] = req.body.option.includes(option)
                        }
                        console.log(roomObj)
                        chat_container.push(new Chat(room_container.addRoom(roomObj)))
                        res.redirect('/room/'+room.dataValues.channel)
                    })
                })
            }else{
                chat_container.push(new Chat(room_container.addRoom(roomObj)))
                res.redirect('/room/'+room.dataValues.channel)
            }
        })
    }
})
app.get('/room/list', async (req,res)=>{
    db.getAllRooms().then((rooms, err)=>{
        if(err)
            console.log(err)
        res.render('list', {"rooms": rooms, "auth": req.authenticated, user: req.username})
    })
})
app.get('/register', (req,res)=>{
    if(req.authenticated) {res.redirect('/')}
    else{
        res.render('register', {"auth": req.authenticated, user: req.username})
    }
})
app.get('/call/:channel', (req,res)=>{
    let room = call_container.where({channel: req.params.channel}).collect()[0]
    if(!room){res.send("Rooms does not exists!");return}
    let userId;
    let isBroadcaster;
    if(req.authenticated){
        isBroadcaster = room.isBroadcaster(req.secret)
        res.render(room.type, {channel: room.channel, id: req.secret, isBroadcaster: isBroadcaster, auth: req.authenticated, user: req.username});
    }else{
        res.send('Not authenticated!')
    }
})
app.post('/call', (req,res)=>{
    db.User.findOne({where:{id:req.body.id}}).then((user,err)=>{
        let call = {
            type: 'conferent',
            id: req.userId,
            name: 'call' + req.userId,
            audio:true,
            video:true,
            screen:true,
            owner: req.secret,
            channel:crypto.randomBytes(10).toString("hex"),
            io: io,
            broadcasters: [req.secret, user.dataValues.secret]
        }
        let call_room = call_container.addRoom(call)
        db.Session.findOne({where:{userId: req.body.id}}).then((ses)=>{
            res.send(call_room.channel)
            notify_sockets[ses.dataValues.sessionToken].emit('call', {channel: call_room.channel, caller: req.username})
        })
        
    })
    
})
app.post('/register', async(req,res)=>{
    let hash = await bcrypt.hash(req.body.password, SALT_ROUNDS)
    db.User.create({username: req.body.name, password: hash, secret: crypto.randomBytes(15).toString('hex')}).then((user,err)=>{
        if(err)
            console.log(err)
        res.redirect("/")

    }).catch(e=>{
        res.send("There is already a user with this username!")
    })
})
app.get('/login', (req,res)=>{
    if(req.authenticated) {res.redirect('/')}
    else{
        res.render('login', {"auth": req.authenticated, user: req.username})
    }
})
app.get('/logout', async(req,res)=>{
    if(!req.authenticated){res.redirect('/')}
    else{
        if(req.userId){
            db.goOffline(req.userId,()=>{
                db.destroySession(req.cookies.sessionToken).then(()=>{
                    res.clearCookie("sessionToken");
                    res.redirect('/')
                })
            })
        }
    }
})
app.post('/login', async(req,res)=>{
    db.logUser(req.body,(user)=>{
        if(user){
            let authenticated = bcrypt.compareSync(req.body.password, user.dataValues.password)
            if(authenticated){
                db.checkForSessionOrCreate(user.dataValues.id, crypto.randomBytes(10).toString("hex")).then((ses,err)=>{ 
                    res.cookie('sessionToken' , ses[0].dataValues.sessionToken).redirect('/')
                })
            }else{
                res.send("The password and username doesn't match!")
            }
        }
    },(e)=>{
        res.send("There is no user with this username!")
    })
})
app.get('/streams', async(req,res)=>{
    if(!req.authenticated){res.redirect('/')}
    else{
        let payload = room_container.where({type:"streaming"}).collect()
        for(let room of payload){
            let user = await db.User.findOne({where:{secret: room.owner}})
            room.username = user.dataValues.username

        }
        res.render("list", {room_rows: OneDToTwoD(payload,3), auth: req.authenticated, user: req.username})
    }
})
app.get('/room/:channel',async (req,res)=>{
    let room = room_container.where({channel: req.params.channel}).collect()[0]
    if(!room){res.send("Rooms does not exists!");return}
    let userId;
    let isBroadcaster;
    if(req.authenticated){
        isBroadcaster = room.isBroadcaster(req.secret)
        res.render(room.type, {channel: room.channel, id: req.secret, isBroadcaster: isBroadcaster, auth: req.authenticated, user: req.username});
    }else{
        userId = crypto.randomBytes(10).toString("hex")
        isBroadcaster = false
        res.render(room.type, {channel: room.channel, id: userId, isBroadcaster: isBroadcaster, auth: req.authenticated, user: req.username});
    }
    
})
io.on('connection', function (socket) {
    if(socket.request.headers.cookie){
        let token = cookie.parse(socket.request.headers.cookie)["sessionToken"]
        if(token){
            notify_sockets[token] = socket
            socket.on('page_left', (reason)=>{
                db.getLoggedUser(token).then(user=>{
                    let userId = user.dataValues.user.dataValues.id
                    db.goOffline(userId)
                })
            })
        }
    }
})
