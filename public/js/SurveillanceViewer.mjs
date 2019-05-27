import Viewer from './SurveillanceSpectator.js'
import Player from './Player.js'
let connection = null;

window.onload = ()=>{
    let connections = 1;
    connection = new Viewer(io,window.id)
    let player = null;
    connection.subscribeTo(window.channel, ()=>{
        connection.onBroadcaster((mEl, socket_id, constrains)=>{
            console.log(constrains)
            player = new Player({'media': connection, 'socket_id': socket_id, 'constrains': constrains, 'reso': '1by1'},3);
            if(connections / 3 == 1){
                let breaker = $('<div class="w-100">');
                $('.row:nth-child(1)').append(breaker)
            }
            connection.onBroadcastNegotiation((constrains,mEl)=>{
                
                player.negotiatePlayer(constrains, connection)
            })
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
    })
    
}