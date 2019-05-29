import Viewer from './Viewer.js'
import Player from './Player.js'
let connection = null;

window.onload = ()=>{
    let connections = 0;
    connection = new Viewer(io,id)
    let players = {};
    connection.subscribeTo(window.channel, (mEl, socket_id, constrains)=>{
        connection.onBroadcaster((mEl, socket_id, constrains)=>{
            players[socket_id] = new Player({'media': mEl, 'socket_id': socket_id, 'constrains': constrains, reso: '1by1'},9);
            if(connections / 3 == 1){
                let breaker = $('<div class="w-100">');
                $('.row:nth-child(1)').append(breaker)
            }
            connections++
            $('.row:nth-child(1)').append(players[socket_id].getPlayer())  
        })  
    })
    connection.onBroadcastNegotiation((constrains,mEl)=>{
        players[socket_id].negotiatePlayer(constrains, mEl)
    })
    connection.onPeerDiscconect((socket_id)=>{
        players[socket_id].removePlayer()
        connections--
        if(connections / 3 == 1){
            $(".w-100").last().remove();
        }
    })
}