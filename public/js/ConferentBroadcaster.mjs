
import Broadcaster from './Broadcaster.js'
import Player from './Player.js'
let connection = null 
window.Broadcaster = Broadcaster;
window.onload = ()=>{
    var SIGNALING_SERVER = "http://localhost";
    connection = new Broadcaster("http://localhost", io() ,null,window.id)
    let connections = 1;
    console.log('what')
    let columnsOnMedia = 3;
    connection.subscribeTo(window.channel, (mEl)=>{
        let player = new Player({'media': connection, 'constrains': connection.getConstrains(), 'reso': '1by1'},3)
        $('.row:nth-child(1)').append(player.getPlayer())
    })
    connection.onBroadcaster((mEl, socket_id, constrains)=>{
        let player = new Player({'media': mEl, 'socket_id': socket_id, 'constrains': constrains},3);
        if(connections / 3 == 1){
            let breaker = $('<div class="w-100">');
            $('.row:nth-child(1)').append(breaker)
        }
        connections++
        $('.row:nth-child(1)').append(player.getPlayer())
    })
    connection.onPeerDiscconect((socket_id)=>{
        $(`#${socket_id}`).remove()
        connections--
        if(connections / 3 == 1){
            $(".w-100").last().remove();
        }
    })
}