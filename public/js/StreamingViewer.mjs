import Viewer from './Viewer.js'
import Player from './Player.js'
import Chat from './Chat.mjs'
let connection = null;

window.onload = ()=>{
    connection = new Viewer("http://localhost",io,id)
    let player =null;
    connection.subscribeTo(window.channel, ()=>{
        console.log('what')
        connection.onBroadcaster((mEl, socket_id, constrains)=>{
                console.log('what')
                player = new Player({'media': mEl, 'socket_id': socket_id, 'constrains': constrains, reso: '16by9'},9);
                let chat = new Chat(connection.getSocket())
                $('.big-container').append(chat.getChatInstance())

                $('.row').append(player.getPlayer())
                connection.onBroadcastNegotiation((constrains,mEl)=>{
                    console.log(constrains)
                    console.log(mEl.srcObject.getTracks())
                    player.negotiatePlayer(constrains, mEl)
                })
            
        })

    })

}