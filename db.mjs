import pg from 'pg'
import crypto from 'crypto'
export default class DbManager {
    constructor(connectionString) {
        this.connectionString = connectionString
        this.pool = new pg.Pool(this.connectionString)
        this.roomOptions = ['audio','video','screen']
        this.optionsMapping = {
            on : true,
            undefined : false
        }
    }
    async initializeTables() {
        let client = await this.pool.connect()
        try {
            await client.query('BEGIN')
            client.query("CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY, username VARCHAR(25) UNIQUE, password VARCHAR(60))")
            client.query("CREATE TABLE IF NOT EXISTS rules(id SERIAL PRIMARY KEY, audio BOOLEAN, video BOOLEAN, screen BOOLEAN)")
            client.query("CREATE TABLE IF NOT EXISTS rooms(id SERIAL PRIMARY KEY, owner INTEGER REFERENCES users(id), name VARCHAR(40) not null, rulesId INTEGER REFERENCES rules(id) not null)")
            client.query("CREATE TABLE IF NOT EXISTS sessions(userId INTEGER REFERENCES users(id) UNIQUE, sessionToken VARCHAR(60) UNIQUE)")
            await client.query('COMMIT')
        } catch (e) {
            await client.query('ROLLBACK')
            throw e
        } finally {
            client.release()
        }
    }
    async findSession(token){
        let client = await this.pool.connect()
        let res = await client.query("SELECT * FROM sessions WHERE sessiontoken=$1", [token])
        client.release()

        return res.rows[0]
    }
    async destroySession(token){
        let client = await this.pool.connect()
        let res = await client.query("DELETE FROM sessions WHERE sessiontoken=$1", [token])
        client.release()
    }
    async createSession(name){
        let client = await this.pool.connect()
        let res = await client.query("INSERT INTO sessions(userId,sessiontoken) VALUES($1,$2) ON CONFLICT(sessiontoken) DO UPDATE SET sessiontoken = excluded.sessiontoken returning sessiontoken", [name, crypto.randomBytes(20).toString("hex")])
        client.release()
        return res.rows[0]['sessiontoken']
    }
    async registerUser(name, hash){        
        let client = await this.pool.connect()
       
        let res = await client.query("INSERT INTO users(username,password) VALUES($1,$2) ON CONFLICT DO NOTHING returning id", [name, hash])
        client.release()

        if(res.rows.length == 0){
            
            return undefined
        }
        return res.rows[0]
    }
    async logUser(req){
        let client = await this.pool.connect()
        try{
            let res = await client.query('SELECT * FROM users WHERE username=$1', [req.name])
            client.release()
            return res.rows[0]
        }catch(e){
            console.log(e)
            client.release()
            return undefined
        }
    }
    async createRoom(req) {
        let client = await this.pool.connect()
        let values = []
        //values.push(req.name)
        this.roomOptions.map((option)=>{
            values.push(this.optionsMapping[req[option]])
        })
        
        let res = await client.query("INSERT INTO rules(audio, video, screen) VALUES ($1,$2,$3) returning id", values)
        await client.query("INSERT INTO rooms(name, rulesId) VALUES ($1,$2)", [req.name,res.rows[0].id])
        client.release()
    }
    async getAllRooms(){
        let client = await this.pool.connect()
        let res = await client.query("SELECT * FROM rooms")
        client.release()
        return res.rows
    }
    async getRules(id){
        let client = await this.pool.connect()
        let res = await client.query("SELECT * FROM rules WHERE id=$1", [id])
        client.release()
        return res.rows
    }
}