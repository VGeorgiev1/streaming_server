import pg from 'pg'
import crypto from 'crypto'
export default class DbManager {
    constructor(connectionString,ssl) {
        this.ssl
        this.connectionString = connectionString
        //this.pool = new pg.Pool(this.connectionString)
        this.roomOptions = ['audio','video','screen']
        this.roomTypes = ['streaming', 'conferent']
        this.optionsMapping = {
            on : true,
            undefined : false
        }
    }
    createClient(){
        let conString = this.connectionString
        let sll = this.sll
        return  new pg.Client({
            connectionString: conString,
            ssl: sll
        })
    }
    async initializeTables() {
        let client = this.createClient()
        await client.connect()
        try {
            client.query('BEGIN')
            client.query("SELECT create_users()")
            client.query("SELECT create_rules()")
            client.query("SELECT create_rooms()")
            client.query("SELECT create_sessions()")
            // client.query("CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY, username VARCHAR(25) UNIQUE, password VARCHAR(60))")
            // client.query("CREATE TABLE IF NOT EXISTS rules(id SERIAL PRIMARY KEY, audio BOOLEAN, video BOOLEAN, screen BOOLEAN)")
            // client.query("CREATE TABLE IF NOT EXISTS rooms(id SERIAL PRIMARY KEY, owner INTEGER REFERENCES users(id),type VARCHAR(10), name VARCHAR(40) not null, rulesId INTEGER REFERENCES rules(id))")
            // client.query("CREATE TABLE IF NOT EXISTS sessions(userId INTEGER REFERENCES users(id) UNIQUE, sessionToken VARCHAR(60) UNIQUE)")
            
            await client.query('COMMIT')
        } catch (e) {
            await client.query('ROLLBACK')
            throw e
        } finally {
            client.end();
        }
            
        
    }
    async findSession(token){
        const client = this.createClient()
        await client.connect()
        let res = await client.query("SELECT * FROM sessions WHERE sessiontoken=$1", [token])
        client.end();

        return res.rows[0]
    }
    async destroySession(token){
        const client = this.createClient()
        await client.connect()
        let res = await client.query("DELETE FROM sessions WHERE sessiontoken=$1", [token])
        client.end();
    }
    async createSession(name){
        const client = this.createClient()
        await client.connect()
        let res = await client.query("INSERT INTO sessions(userId,sessiontoken) VALUES($1,$2) returning sessiontoken", [name, crypto.randomBytes(20).toString("hex")])
        client.end();
        return res.rows[0]['sessiontoken']
    }
    async registerUser(name, hash){        
        const client = this.createClient()
        await client.connect()
        let res = await client.query("INSERT INTO users(username,password) VALUES($1,$2) returning id", [name, hash])
        client.end()

        if(res.rows.length == 0){
            
            return undefined
        }
        return res.rows[0]
    }
    async logUser(req){
        const client = this.createClient()
        await client.connect()

        try{
            let res = await client.query('SELECT * FROM users WHERE username=$1', [req.name])
            client.end();
            return res.rows[0]
        }catch(e){
            console.log(e)
            client.end();
            return undefined
        }
    }
    async getLoggedUser(sessionToken){
        const client = this.createClient()
        await client.connect()
        let res = await client.query("SELECT * FROM sessions as s LEFT JOIN users as u ON s.userId = u.id WHERE sessiontoken=$1", [sessionToken])
        client.end();
        return res.rows[0].id
    }
    async createRoom(owner,req) {
        const client = this.createClient()
        await client.connect()
        let rulesId = null;
        let options = []
        if(req.options){
            for(let i=0;i<this.roomOptions.length;i++){
                if(req.option.indexOf(this.roomOptions[i]) != -1){
                    options[i] = true
                }else{
                    options[i] = false
                }
            }
        }
        if(req.type == 'conferent'){
            rulesId = (await client.query("INSERT INTO rules(audio, video, screen) VALUES ($1,$2,$3) returning id", options)).rows[0].id
        }
        let room_res = await client.query("INSERT INTO rooms(owner,name,type,rulesId) VALUES ($1,$2,$3,$4) returning id", [owner,req.name,req.type,rulesId])

        client.end();
        return room_res.rows[0].id
    }
    async checkForSessionOrCreate(id){
        const client = this.createClient()
        await client.connect()
        let res =await client.query("SELECT * FROM sessions WHERE userid=$1", [id])
        client.end()
        if(res.rows.length == 0){
            return await this.createSession(id)
        }else{
            return res.rows[0]['sessiontoken']
        }
        
    }
    async getAllRooms(){
        const client = this.createClient()
        await client.connect()
        let res = await client.query("SELECT * FROM rooms")
        client.end();
        return res.rows
    }
    async getAllRoomsAndRules(){
        const client = this.createClient()
        await client.connect()
        let res = await client.query("SELECT * FROM rules as rl RIGHT JOIN rooms as rm ON rl.id = rm.rulesId")
        client.end();
        return res.rows
    }
    async getRules(id){
        const client = this.createClient()
        await client.connect()
        let res = await client.query("SELECT * FROM rules WHERE id=$1", [id])
        client.end();
        return res.rows
    }
}