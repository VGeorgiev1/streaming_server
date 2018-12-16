import pg from 'pg'
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/stream_app';
console.log(process.env.DATABASE_URL)
let client = new pg.Client(connectionString)
client.connect(()=>{
    client.query(
        'CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY, name VARCHAR(40) not null, password VARCHAR(20) not null)',
        (err,res)=>{
            if(err)
                console.log(err)
            console.log(res)
        }
    );
})
