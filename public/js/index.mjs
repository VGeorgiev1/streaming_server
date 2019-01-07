import Broadcaster from './Broadcaster.js'
import Viewer from './Viewer.js'
window.onload = ()=>{
    window.Broadcaster = Broadcaster
    var SIGNALING_SERVER = "http://localhost";
    if(window.isBroadcaster){
        let connection = new Broadcaster("http://localhost",window.channel, io() ,null,id)
        $('body').append($('<input id="slider" type="range" min="8" max="500" value="50">').change(function(){
            connection.setAudioBitrates($(this).val())
        }))
        $('body').append($('<input id="slider1" type="range" min="50" max="500" value="256">').change(function(){
            connection.setVideoBitrates($(this).val())
        }))
        $('body').append(($('<button>').html('Mute').click(function(){
            connection.mute_audio()
        })))
    }
    else{
        console.log('viewer')
        let connection = new Viewer("http://localhost",window.channel,io(),id)
    }
}