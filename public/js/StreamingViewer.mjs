import Viewer from './Viewer.js'
import Player from './Player.js'
let connection = null;

window.onload = ()=>{
    connection = new Viewer("http://localhost",io(),id)
    
    connection.subscribeTo(window.channel, ()=>{
    })
    connection.onBroadcaster((mEl, socket_id, constrains)=>{
        let player = new Player({'media': mEl, 'socket_id': socket_id, 'constrains': constrains, reso: '16by9'},12);
        $('.row').append(player.getPlayer())
    })
}