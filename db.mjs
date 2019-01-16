import crypto from 'crypto'
import Sequelize from 'sequelize'
import User from './models/User.mjs'
import Rule from './models/Rule.mjs'
import Room from './models/Room.mjs'
import Session from './models/Session.mjs'

export default class DbManager {
    constructor() {
        this.roomOptions = ['audio','video','screen']
        this.roomTypes = ['streaming', 'conferent']
        if (process.env.DATABASE_URL) {
            this.seq = new Sequelize(process.env.DATABASE_URL, {
                dialect: 'postgres',
                protocol: 'postgres',
                logging: false,
                operatorsAliases: false
            })
            
        } else {
            this.seq = new Sequelize('stream_app', 'postgres', 'kon4etobon4eto', {
                host:'localhost',
                dialect:'postgres'
            });
        }
        
    }
    destroySession(sessionToken){
        return this.Session.destroy({
            where: {sessionToken: sessionToken}
        })
    }
    getAllRooms(){
        return this.Room.findAll({})
    }
    createRoom(user_id, req){
        let options = {
            audio: false,
            video: false,
            screen: false
        }
        if(req.option){
            for (let i = 0; i < this.roomOptions.length; i++) {
                console.log(req.options)
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
        return this.Session.findOrCreate({where: {userId: id}, defaults:{sessionToken: crypto}})
    }
    logUser(req){
        return this.User.findOne({where: {username: req.name}})
    }
    getAllRoomsAndRules(){
        return this.Room.findAll({include: [this.Rule]})
    }
    initializeTables(callback){
        this.seq.authenticate()
        .then(() => {
            console.log('Connection to the database has been established successfully.');
            this.User = User(this.seq, Sequelize)
            this.Rule = Rule(this.seq, Sequelize)
            this.Room = Room(this.seq, Sequelize)
            this.Session = Session(this.seq, Sequelize)
            this.Room.belongsTo(this.Rule, {foreignKey: 'rulesId'})
            this.Room.belongsTo(this.User, {foreignKey: 'owner'})            
            this.Session.belongsTo(this.User, {foreignKey: 'userId'})
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