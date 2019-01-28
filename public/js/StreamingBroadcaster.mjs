import Broadcaster from './Broadcaster.js'
import Player from './Player.js'
var SIGNALING_SERVER = "http://localhost";

document.addEventListener('screen_ready', function() {

    let screen = new Broadcaster(SIGNALING_SERVER,io(),'screen-share',window.id)
    screen.subscribeTo(window.channel, (mEl)=>{
        console.log(screen.getConstrains())
        let player = new Player({'media': screen, 'constrains': screen.getConstrains(), reso: '16by9'},12)
        $('.row').append(player.getPlayer())

    })
});
