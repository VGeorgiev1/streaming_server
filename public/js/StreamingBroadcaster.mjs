import Broadcaster from './Broadcaster.js'
import Player from './Player.js'
var SIGNALING_SERVER = "http://localhost";

document.addEventListener('screen_ready', function() {
    let screen = new Broadcaster(SIGNALING_SERVER,io(),'screen-share',window.id)
    screen.subscribeTo(window.channel, (mEl)=>{
        let player = new Player({'media': screen, 'constrains': screen.getConstrains(), reso: '16by9'},12)
        screen.requestAudio()
        $('.row').append(player.getPlayer())
    })

});