import Viewer from './Viewer.js'
import Player from './Player.js'
let connection = null;

window.onload = ()=>{
    let connections = 0;
    connection = new Viewer("http://localhost",io,id)
    let player = null;
    connection.subscribeTo(window.channel, (mEl, socket_id, constrains)=>{
        connection.onBroadcaster((mEl, socket_id, constrains)=>{
            player = new Player({'media': mEl, 'socket_id': socket_id, 'constrains': constrains, reso: '1by1'},9);
            if(connections / 3 == 1){
                let breaker = $('<div class="w-100">');
                $('.row:nth-child(1)').append(breaker)
            }
            connections++
            $('.row:nth-child(1)').append(player.getPlayer())  
        })  
    })
    connection.onBroadcastNegotiation((constrains,mEl)=>{
        player.negotiatePlayer(constrains, mEl)
    })
    connection.onPeerDiscconect((socket_id)=>{
        $(`#${socket_id}`).remove()
        connections--
        if(connections / 3 == 1){
            $(".w-100").last().remove();
        }
    })
}