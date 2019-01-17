import Viewer from './Viewer.js'
let connection = null;

window.onload = ()=>{
    connection = new Viewer("http://localhost",io(),id)
    
    connection.subscribeTo(window.channel, ()=>{
        console.log('Connected')
    })
    connection.onBroadcaster((mEl)=>{
       $('.card-body').append(mEl)
    })
}