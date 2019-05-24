import Broadcaster from './Broadcaster.js'
import Player from './Player.js'
import Chat from './Chat.mjs'
var SIGNALING_SERVER = "http://localhost";
let constrains = {}
$('.row').append($('<button class="btn btn-success btn-block col-md-9 col-sm-9 col-9 start">').text('Screen share').click(()=>{
    constrains.screen = true;
    constrains.audio = true;
    constrains.video = true;
    createConnection(constrains)
}))
$('.row').append($('<button class="btn btn-success btn-block col-md-9 col-sm-9 col-9 start">').text('Audio streaming').click(()=>{
    constrains.audio = true;
    createConnection(constrains)
}))
$('.row').append($('<button class="btn btn-success btn-block col-md-9 col-sm-9 col-9 start">').text('Audio + video streaming').click(()=>{
    constrains.audio = true;
    constrains.video = true;
    createConnection(constrains)
}));
function createConnection(constrains){
    $('.start').each((i,b)=>{
        $(b).remove();
    });

    let broadcaster = new Broadcaster(io,constrains,window.id)
    broadcaster.subscribeTo(window.channel, (mEl)=>{
        let player = new Player({'media': broadcaster, 'constrains': constrains, reso: '16by9'},9)
        let chat = new Chat(broadcaster.getSocket())
        $('.row').prepend(player.getPlayer())
        $('.big-container').append(chat.getChatInstance())
        $('.card-body').append($('<button class="btn btn-success">Start audio with mixing</button>').click(()=>{
            broadcaster.requestAudio()
        }))
        $('.card-body').append($('<button class="btn btn-success">Start video with mixing</button>').click(()=>{
            broadcaster.mixVideoSources()
        }))
    }) 
}


