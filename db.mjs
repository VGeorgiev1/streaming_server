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
    createRoom(user_id, req){
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
                return this.Room.create({owner: user_id, type: req.type, name:req.name, rulesId:rules.dataValues.id})
            })
        }
        return this.Room.create({owner: user_id, type: req.type, name:req.name, rulesId:null})

    }
    getLoggedUser(token){
        return this.Session.findOne({where:{sessionToken: token}, include:[this.User]})
    }
    checkForSessionOrCreate(id, crypto){
        console.log(crypto)
        return this.Session.findOrCreate({where: {userId: id}, defaults:{sessionToken: crypto}})
    }
    logUser(req){
        return this.User.findOne({where: {username: req.name}})
    }
    getAllRoomsAndRules(){
        return this.Room.findAll({include: [this.Rule,{model:this.User, as:'owned_by'}]})
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
            this.seq.sync()
            .then(() => {
                callback()
            })
        })
        .catch(err => {
            console.error('Unable to connect to the database:', err);
        });
    }
}