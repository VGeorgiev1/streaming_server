import Broadcaster from './Broadcaster.js'
import Viewer from './Viewer.js'
window.onload = ()=>{
    let socket = io()
    var SIGNALING_SERVER = "http://localhost";
    if(isOwner){
        let connection = new Broadcaster("http://localhost",channel, socket ,null,id)
    }
    else{
        let connection = new Viewer("http://localhost",channel, socket,id)
    }
}