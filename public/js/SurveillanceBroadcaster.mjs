import Broadcaster from './SurveillanceBroadcast.mjs'
import Player from './Player.js'
import Chat from './Chat.mjs'
let connection = null 
window.Broadcaster = Broadcaster;

window.onload = ()=>{
    connection = new Broadcaster(io ,{audio: true, video: false},window.id)
    let connections = 1;
    let columnsOnMedia = 3;
    
    connection.subscribeTo(window.channel, (mEl)=>{
        let broadcaster = new Player({'media': connection.getMediaElement(),'constrains': connection.getConstrains(), 'reso': '1by1'},3)
        connection.onMediaNegotion(()=>{
            broadcaster.negotiatePlayer(connection.getConstrains(), connection.getMediaElement())
        })
        $('.row:nth-child(1)').append(broadcaster.getPlayer())
    })
}
