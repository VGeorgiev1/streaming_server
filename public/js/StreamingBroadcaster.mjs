import Broadcaster from './Broadcaster.js'
import Player from './Player.js'
import Chat from './Chat.mjs'
var SIGNALING_SERVER = "http://localhost";

document.addEventListener('screen_ready', function() {
    console.log(window.id)
    let screen = new Broadcaster(io,'screen-share',window.id)
    screen.subscribeTo(window.channel, (mEl)=>{
        let player = new Player({'media': screen, 'constrains': screen.getConstrains(), reso: '16by9'},9)
        let chat = new Chat(screen.getSocket())
        $('.row').prepend(player.getPlayer())
        $('.big-container').append(chat.getChatInstance())
        //screen.requestAudio()
        $('.card-body').append($('<button class="btn btn-success">Start video with mixing</button>').click(()=>{
            screen.requestAudio()//screen.mixVideoSources(screen.getVideoTrack())
        }))
    })
});

// let user_media = new Broadcaster(SIGNALING_SERVER, io, {audio: true, video: false}, window.id)
// user_media.subscribeTo(window.channel, (mEl)=>{
//     let player = new Player({'media': user_media, 'constrains': user_media.getConstrains(), reso: '16by9'},12)
//     $('.row').append(player.getPlayer())
// })