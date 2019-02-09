
var PORT = process.env.PORT || 3000;


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
import Chat from './Chat.mjs'
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

var loginware = function (req, res, next) {
    
    db.Session.findOne({where:{sessionToken: req.cookies.sessionToken},
         include: [db.User]}).then((ses,err)=>{
        if(err)
            console.log(err)
        req.authenticated = false
        if(ses){
            req.authenticated = true
            req.userId = ses.userId
            req.username = ses.dataValues.user.dataValues.username
        }
        next()
    })
}
app.use(loginware)
let room_container = new RoomContainer()
let chat_container = []
let db = new DbManager()
db.initializeTables(()=>{
    db.getAllRoomsAndRules().then((rooms,err)=>{
        if(err)
            console.log(err)
        for(let room of rooms){
            chat_container.push(new Chat(room_container.addRoom(room.dataValues)))
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
    let payload = []
    db.getAllRooms({include: [{model:db.User, as:'owned_by'}]}).then(rooms=>{
        for(let room of rooms){
            room.dataValues.active = room_container.getRoom(room.dataValues.id).active
            room.dataValues.owned_by = room.dataValues.owned_by.dataValues
            payload.push(room.dataValues)
        }  
        res.render("list", {room_rows: OneDToTwoD(payload,3), auth: req.authenticated, user: req.username})
    })
    
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
                res.send('ok')           
            })
    }
})
app.post('/remove', (req,res)=>{
    db.Friends.destroy({where:{
            userId: Math.min(req.userId,req.body.id), friendId: Math.max(req.userId,req.body.id)}
        }).then((result)=>{
            res.send("removed")
        })
})
app.post('/search', (req,res)=>{
    db.User.findAll({
        where:{
            username: {
                [db.Op.like]: `%${req.body.username}%`
            }
        }}).then(async (users,err)=>{
            let dataValues = []
            for(let user of users){
                if(user.dataValues.id != req.userId){
                    let row = await db.Friends.findOne({where:{
                        userId: Math.min(user.dataValues.id, req.userId),  
                        friendId: Math.max(user.dataValues.id, req.userId)},
                        include: [
                            {model: db.User,as: 'friend'},
                            {model: db.User,as: 'user'}]
                    })
                    
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
    console.log(req.userId)
    if(!req.authenticated) {res.redirect('/login')}
    else{
    db.Friends.findAll({where:{
        [db.Op.or]:[
            {userId: req.userId},
            {friendId: req.userId}]},
        include: [
            {model: db.User,as: 'friend'},
            {model: db.User,as: 'user'}
        ]}).then((users, err)=>{
            let dataValues = []
            for(let row of users){
                if(req.userId == row.userId){
                    dataValues.push({id: row.friend.dataValues.id, username: row.friend.dataValues.username, status:row.status})
                }else{
                    dataValues.push({id: row.user.dataValues.id, username: row.user.dataValues.username, status: row.status == 'friends' ? row.status: row.status == 'invite' ? 'request': 'invite'})
                }
            }
            res.render('people',{people_list:OneDToTwoD(dataValues, 3), auth: req.authenticated, user: req.username})
        })
    }
})
app.get('/profile',(req, res)=>{
    if(!req.authenticated) {res.redirect('/login')}
    else{
        db.User.findOne({where:{id: req.userId}}).then((usr,err)=>{
           
            //console.log(OneDToTwoD(dataValues, 3))
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
            res.render('list', {"rooms": rooms, "auth": req.authenticated, user: req.username})
    })
})
app.get('/register', (req,res)=>{
    if(req.authenticated) {res.redirect('/')}
    else{
        res.render('register', {"auth": req.authenticated, user: req.username})
    }
})
app.post('/register', async(req,res)=>{
    let hash = await bcrypt.hash(req.body.password, SALT_ROUNDS)
    db.User.create({username: req.body.name, password: hash}).then((user,err)=>{
        if(err)
            console.log(err)
        if(user.dataValues.id){
            res.redirect("/")
        }else{
            res.send("There is already a user with this username!")
        }
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
        db.destroySession(req.cookies.sessionToken).then(()=>{
            res.clearCookie("sessionToken");
            res.redirect('/')
        })
    }
})
app.get('/streams', async(req,res)=>{
    if(!req.authenticated){res.redirect('/')}
    else{
        db.getAllRooms({where:{type:"streaming"}, include:[{model:db.User, as:'owned_by'}]}).then(rooms=>{
            let payload = []
            for(let room of rooms){
                room.dataValues.active = room_container.getRoom(room.dataValues.id).active
                room.dataValues.owned_by = room.dataValues.owned_by.dataValues
                payload.push(room.dataValues)
            }  
            res.render("list", {room_rows: OneDToTwoD(payload,3), auth: req.authenticated, user: req.username})
        })
    }
})
app.post('/login', async(req,res)=>{
    db.logUser(req.body).then((user,err)=>{
        if(user){
            let authenticated = bcrypt.compareSync(req.body.password, user.dataValues.password)
            if(authenticated){
                db.checkForSessionOrCreate(user.dataValues.id, crypto.randomBytes(10).toString("hex")).then((ses,err)=>{
                    console.log(ses[0].dataValues.sessionToken)
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
    
    let isBroadcaster;
    if(req.authenticated){
        db.getLoggedUser(req.cookies.sessionToken).then((ses,err)=>{
            if(err)
                console.log(err)
            userId = ses.dataValues.user.dataValues.id
            isBroadcaster = room.isBroadcaster(userId)
            res.render(room.type, {channel: req.params.id, id: userId, isBroadcaster: isBroadcaster, auth: req.authenticated, user: req.username});
        })
    }else{
        userId = crypto.randomBytes(10).toString("hex")
        isBroadcaster = false
        res.render(room.type, {channel: req.params.id, id: userId, isBroadcaster: isBroadcaster, auth: req.authenticated, user: req.username});
    }
    
})
io.sockets.on('connection', function (socket) {
    room_container.subscribeSocket(socket);
})
