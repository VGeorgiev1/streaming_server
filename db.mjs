import crypto from 'crypto'
import Sequelize from 'sequelize'
const Op = Sequelize.Op
import User from './models/User.mjs'
import Rule from './models/Rule.mjs'
import Room from './models/Room.mjs'
import Session from './models/Session.mjs'
import Friends from './models/Friend.mjs'
export default class DbManager {
    constructor() {
        this.roomOptions = ['audio','video','screen']
        this.roomTypes = ['streaming', 'conferent', 'surveillance']
        if (process.env.DATABASE_URL) {
            this.seq = new Sequelize(process.env.DATABASE_URL, {
                dialect: 'postgres',
                protocol: 'postgres',
                logging: false,
                operatorsAliases: false
            })
            
        }
        this.Op = Op
    }
    getFriends(id,callback){
        return this.Friends.findAll({where:{
            [this.Op.or]:[
                {userId: id},
                {friendId: id}]},
            include: [
                {model: this.User,as: 'friend'},
                {model: this.User,as: 'user'}
            ]})
    }
    goOffline(id,callback){
        this.User.findOne({where:{id: id}}).then(async(user)=>{
            if(user){
                await user.update({online: false}, {fields: ['online']})   
            }
            if(callback){
                callback()
            }
        })
    }
    destroySession(sessionToken){
        return this.Session.destroy({
            where: {sessionToken: sessionToken}
        })
    }
    getAllUsers(){
        return this.User.findAll({})
    }
    getAllRooms(options){
        return this.Room.findAll(options)
    }
    createRoom(owner_secret, req, callback){
        let options = {
            audio: false,
            video: false,
            screen: false
        }
        if(req.option){
            for (let i = 0; i < this.roomOptions.length; i++) {
                if (req.option.indexOf(this.roomOptions[i]) != -1) {
                    options[this.roomOptions[i]] = true;
                }
            }
        }
        if(req.type == 'conferent'){
            this.Rule.create(options).then((rules, err)=>{
                if(err)
                    console.log(err)
                this.Room.create({owner: owner_secret, type: req.type, name:req.name,channel: crypto.randomBytes(10).toString("hex"), rulesId:rules.dataValues.id})
                    .then(room=>{
                        callback(room)
                    })
            })
        }else{
            this.Room.create({owner: owner_secret, type: req.type, name:req.name,channel: crypto.randomBytes(10).toString("hex"), rulesId:null})
                .then(room=>{
                    callback(room)
                })
        }

    }
    getLoggedUser(token){
        return this.Session.findOne({where:{sessionToken: token}, include:[this.User]})
    }
    checkForSessionOrCreate(id, crypto){
        return this.Session.findOrCreate({where: {userId: id}, defaults:{sessionToken: crypto}})
    }
    logUser(req,callback,errorback){
        this.User.findOne({where: {username: req.name}}).then(async(user)=>{
            await user.update({online: true}, {fields: ['online']})
            callback(user)
        }).catch((e)=>{
            errorback(e)
        })
    }
    getAllRoomsAndRules(callback){
        return this.Room.findAll({include: [this.Rule,{model:this.User, as:'owned_by'}]})
    }
    findSession(token){
        return this.Session.findOne({where:{sessionToken: token},include: [this.User]})
    }
    findUserByUsername(usrname){
        return this.User.findAll({where:{
                    username: {
                        [this.Op.like]: `%${usrname}%`
                    }
                }})
    }
    findFriend(userId,friendId){
        return this.Friends.findOne({where:{
            userId: Math.min(userId, friendId),  
            friendId: Math.max(userId, friendId)},
            include: [
                {model: this.User,as: 'friend'},
                {model: this.User,as: 'user'}]
        })
    }
    removeFriend(userId, friendId){
       return this.Friends.destroy({where:{
            userId: Math.min(userId,friendId), friendId: Math.max(userId,friendId)}
        })
    }
    initializeTables(callback){
        this.seq.authenticate()
        .then(() => {
            console.log('Connection to the database has been established successfully.');
            this.User = User(this.seq, Sequelize)
            this.Rule = Rule(this.seq, Sequelize)
            this.Room = Room(this.seq, Sequelize)
            this.Session = Session(this.seq, Sequelize)
            this.Friends = Friends(this.seq, Sequelize)
            this.Room.belongsTo(this.Rule, {foreignKey: 'rulesId'})
            this.Room.belongsTo(this.User, {as:'owned_by', foreignKey: 'owner'})            
            this.Session.belongsTo(this.User, {foreignKey: 'userId'})
            this.Friends.belongsTo(this.User, {as: 'user'});
            this.Friends.belongsTo(this.User, {as: 'friend'})
            return this.seq.sync()
            .then(() => {
                callback()
            })
        })
        .catch(err => {
            console.error('Unable to connect to the database:', err);
        });
    }
}