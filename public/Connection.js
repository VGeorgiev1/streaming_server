export default class Connection{
    constructor(SIGNALING_SERVER,CHANNEL){
        this.signaling_server = SIGNALING_SERVER;
        this.signaling_socket = io()
        this.channel = CHANNEL
        this.peers = {};
        this.peer_media_elements = {};
    }
    regConnectHandler(callback){
        this.signaling_socket.on('connect', callback);
    }
    regDiscconectHandler(callback){
        this.signaling_socket.on('disconnect', callback);
    }
    regHandler(event,callback){
        this.signaling_socket.on(event, callback);
    }
    part_channel() {
        this.signaling_socket.emit('part', 'let me out');
    }
    join_channel(constrains) { 
        this.signaling_socket.emit('join', {"constrains": constrains});
    }
    async findDevices(callback){
        navigator.mediaDevices.enumerateDevices().then(devices =>{
            let use_audio, use_video = false
            for(let i=0;i<devices.length;i++){
                if(devices[i].kind === 'audioinput') use_audio = true;
                if(devices[i].kind === 'videoinput') use_video = true;
            }
            callback({'audio': use_audio, 'video': use_video})
        })
    }
    findWebRTC(){
        return (navigator.getUserMedia ||
               navigator.webkitGetUserMedia ||
               navigator.mozGetUserMedia ||
               navigator.msGetUserMedia)
    }
    attachMediaStream(element, stream){
        element.srcObject = stream;
    }
    setup_media(constrains,stream,elem,options,callback){
        console.log(constrains)
        var media = constrains.video ? $("<video>") : $("<audio>");
        media.attr("autoplay", "autoplay");
        media.prop("muted", options.muted); /* always mute ourselves by default */
        media.attr("controls", "");
        elem.append(media);
        this.attachMediaStream(media[0], stream);
        if(options.returnElm) return media
    }
    setup_local_media(constrains, elem, callback, errorback) {
        navigator.getUserMedia = this.findWebRTC()
        
        navigator.getUserMedia(constrains, 
            (stream)=>{
                
                this.setup_media(constrains,stream, elem,{muted:true})
                if (callback) callback(stream);
            },
            ()=>{
                alert("You chose not to provide access to the camera/microphone, demo will not work.");
                if (errorback) errorback();
            }
        )
          
    }
}
