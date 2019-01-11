import Broadcaster from './Broadcaster.js'
import Viewer from './Viewer.js'
window.onload = ()=>{
    window.Broadcaster = Broadcaster
    var SIGNALING_SERVER = "http://localhost";
    if(window.isBroadcaster){
        window.connection = new Broadcaster("http://localhost", io() ,null,id)
        window.connection.subscribeTo(window.channel, ()=>{
            $('body').append($('<input id="slider" type="range" min="8" max="500" value="50">').change(function(){
                window.connection.setAudioBitrates($(this).val())
            }))
            $('body').append($('<input id="slider1" type="range" min="50" max="500" value="256">').change(function(){
                window.connection.setVideoBitrates($(this).val())
            }))
            $('body').append(($('<button>').html('Mute').click(function(){
                window.connection.mute_audio()
            })))
            let select = $('body').append(('<select id="mic">'))
            let mics = window.connection.getAudioDevices()
           
            for(let i=0;i < mics.length;i++){
                 console.log(mics[i])
            //     //select.append($('<option id= >'))
             }
        })
    }
    else{
        
        window.connection = new Viewer("http://localhost",io(),id)
        window.connection.subscribeTo(window.channel, ()=>{
            console.log('Connected')
        })
    }
}