import Viewer from './Viewer.js'
import Player from './Player.js'
let connection = null;

window.onload = ()=>{
    let connections = 1;
    connection = new Viewer("http://localhost",io,id)
    let player = null;
    connection.subscribeTo(window.channel, (mEl, socket_id, constrains)=>{
        let player = new Player({'media': mEl, 'socket_id': socket_id, 'constrains': constrains, 'reso': '1by1'},3);
        connection.onBroadcastNegotiation((constrains,mEl)=>{
            player.negotiatePlayer(constrains, mEl)
        })
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