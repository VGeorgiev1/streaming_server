
import Broadcaster from './Broadcaster.js'
import Player from './Player.js'
import Chat from './Chat.mjs'
window.connection = null 
window.Broadcaster = Broadcaster;

window.onload = ()=>{
    console.log('hello')

    window.connection = new Broadcaster(io ,{audio: true, video: false},window.id)
    let players = {}
    let connections = 1;
    let columnsOnMedia = 3;
    window.connection.subscribeTo(window.channel, (mEl)=>{
        console.log('subbed')
        let broadcaster = new Player({'media': window.connection,'constrains': window.connection.getConstrains(), 'reso': '1by1'},3)
        let chat = new Chat(window.connection.getSocket())
        $('.row:nth-child(1)').append(broadcaster.getPlayer())
        $('.big-container').append(chat.getChatInstance())
    })
    window.connection.onBroadcaster((socket_id, constrains,mEl)=>{
        
        if(!constrains.screen){
            players[socket_id] = new Player({'media': mEl, 'socket_id': socket_id, 'constrains': constrains, 'reso': '1by1'},3);
        }else{
            players[socket_id] = new Player({'media': mEl, 'socket_id': socket_id, 'constrains': constrains, 'reso': '16by9'},6);
        }
        
        if(window.connections / 3 == 1){
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
            if(window.connections / 3 == 1){
                $(".w-100").last().remove();
            }
        }
    })
}