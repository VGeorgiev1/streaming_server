
import Broadcaster from './Broadcaster.js'
import Player from './Player.js'
import Chat from './Chat.mjs'
let connection = null 
window.Broadcaster = Broadcaster;

window.onload = ()=>{

    var SIGNALING_SERVER = "http://localhost";
    connection = new Broadcaster(io ,{audio: true, video: false},window.id)
    let players = {}
    let connections = 1;
    let columnsOnMedia = 3;
    connection.subscribeTo(window.channel, (mEl)=>{
        let broadcaster = new Player({'media': connection,'constrains': connection.getConstrains(), 'reso': '1by1'},3)
        let chat = new Chat(connection.getSocket())
        $('.row:nth-child(1)').append(broadcaster.getPlayer())
        $('.big-container').append(chat.getChatInstance())
    })
    connection.onBroadcaster((socket_id, constrains,mEl)=>{
        
        if(!constrains.screen){
            players[socket_id] = new Player({'media': mEl, 'socket_id': socket_id, 'constrains': constrains, 'reso': '1by1'},3);
        }else{
            players[socket_id] = new Player({'media': mEl, 'socket_id': socket_id, 'constrains': constrains, 'reso': '16by9'},6);
        }
        
        if(connections / 3 == 1){
            let breaker = $('<div class="w-100">');
            $('.row:nth-child(1)').append(breaker)
        }
        connections++
        $('.row:nth-child(1)').append(players[socket_id].getPlayer())
    })
    connection.onBroadcastNegotiation((socket_id,constrains,mEl)=>{
        players[socket_id].negotiatePlayer(constrains, mEl)
    })
    connection.onPeerDiscconect((socket_id)=>{
        if(players[socket_id]){
            players[socket_id].removePlayer()
            connections--
            if(connections / 3 == 1){
                $(".w-100").last().remove();
            }
        }
    })
}