import Broadcaster from './Broadcaster.js'
import Viewer from './Viewer.js'
window.onload = ()=>{
    let socket = io()
    var SIGNALING_SERVER = "http://localhost";
    if(isOwner){
        let connection = new Broadcaster("http://localhost",channel, socket ,null,id)
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
        let connection = new Viewer("http://localhost",channel, socket,id)
    }
}