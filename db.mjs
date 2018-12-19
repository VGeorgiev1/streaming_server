import pg from 'pg'
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
            client.query("CREATE TABLE IF NOT EXISTS rules(id SERIAL PRIMARY KEY, audio BOOLEAN, video BOOLEAN, screen BOOLEAN)")
            client.query("CREATE TABLE IF NOT EXISTS rooms(id SERIAL PRIMARY KEY, name VARCHAR(40) not null, rulesId INTEGER REFERENCES rules(id) not null)")
            await client.query('COMMIT')
        } catch (e) {
            await client.query('ROLLBACK')
            throw e
        } finally {
            client.release()
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
}



