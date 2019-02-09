import Viewer from './Viewer.js'
import Player from './Player.js'
let connection = null;

window.onload = ()=>{
    connection = new Viewer("http://localhost",io(),id)
    let player = null;
    connection.subscribeTo(window.channel, ()=>{
        connection.onBroadcaster((mEl, socket_id, constrains)=>{

            player = new Player({'media': mEl, 'socket_id': socket_id, 'constrains': constrains},3);
            $('.row').append(player.getPlayer())
        })
    })

}