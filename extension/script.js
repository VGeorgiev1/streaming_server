var SIGNALING_SERVER = "http://localhost";
var socket = io()
if(window.isBroadcaster){
    let screen = new  window.Broadcaster(SIGNALING_SERVER,window.channel,socket,'screen-share',window.id)
}
