import Viewer from './Viewer.js'
import Player from './Player.js'
window.connection = null;

window.onload = ()=>{
    let connections = 0;
    window.connection = new Viewer(io,id)
    let players = {};
    window.connection.subscribeTo(window.channel, ()=>{
        window.connection.onBroadcaster((socket_id, constrains,mEl)=>{
            
            players[socket_id] = new Player({'media': mEl, 'socket_id': socket_id, 'constrains': constrains, reso: '1by1'},3);
            if(connections / 3 == 1){
                let breaker = $('<div class="w-100">');
                $('.row:nth-child(1)').append(breaker)
            }
            connections++
            $('.row:nth-child(1)').append(players[socket_id].getPlayer())  
        
        })  
        
        window.connection.onBroadcastNegotiation((socket_id,constrains,mEl)=>{
            players[socket_id].negotiatePlayer(constrains, mEl)
        })
        window.connection.onPeerDiscconect((socket_id)=>{
            if(players[socket_id]){
                players[socket_id].removePlayer()
                connections--
                if(connections / 3 == 1){
                    $(".w-100").last().remove();
                }  
            }
        })
    })
    
}