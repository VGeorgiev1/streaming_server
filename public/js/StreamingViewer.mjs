import Viewer from './Viewer.js'
import Player from './Player.js'
import Chat from './Chat.mjs'
let connection = null;

window.onload = ()=>{
    connection = new Viewer(io,window.id)
    let player =null;
    connection.subscribeTo(window.channel, ()=>{
        connection.onBroadcaster((socket_id, constrains,mEl)=>{
                player = new Player({'media': mEl, 'socket_id': socket_id, 'constrains': constrains, reso: '16by9'},9);
                let chat = new Chat(connection.getSocket())
                $('.big-container').append(chat.getChatInstance())
                $('.row').append(player.getPlayer())
        })
        connection.onBroadcastNegotiation((socket_id,constrains,mEl)=>{
            player.negotiatePlayer(constrains, mEl)
        })

        connection.onPeerDiscconect((socket_id)=>{
            player.removePlayer();
        })

    })

}