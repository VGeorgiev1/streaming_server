import Broadcaster from './Broadcaster.js'
import Player from './Player.js'
import Chat from './Chat.mjs'
var SIGNALING_SERVER = "http://localhost";

// //let screen = new Broadcaster(io,'screen-share',window.id)
// screen.subscribeTo(window.channel, (mEl)=>{
//     let player = new Player({'media': screen, 'constrains': {audio: false, video:true}, reso: '16by9'},9)
//     let chat = new Chat(screen.getSocket())
//     $('.row').prepend(player.getPlayer())
//     $('.big-container').append(chat.getChatInstance())
//     $('.card-body').append($('<button class="btn btn-success">Start audio with mixing</button>').click(()=>{
//         screen.requestAudio()
//     }))
// })
