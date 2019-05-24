import Connection from "./Connection.js"
const img = document.getElementById('img');


export default class Broadcaster extends Connection{
    constructor(IO,CONSTRAINS,ID){
        super(IO,ID)
        this.constrains = {};

        this.media_element = null
        this.senders = {}
        this.audio_devices = []
        this.video_devices = []
        this.properties = {
            audioBitrate : 50,
            videoBitrate : 256
        }
        this.offers = {}
        if(!CONSTRAINS.screen){
            this.constrains = CONSTRAINS
            this.local_media_stream = null
        }else{
            this.is_screen_share = true
            this.constrains.video = true
            this.constrains.audio = true;
            this.local_media_stream = null;
        }
    
    }
    
    getAudioDevices(){
        return this.audio_devices;
    }
    getVideoDevices(){
        return this.video_devices;
    }
    setAudioBitrates(audioBitrate) {
        audioBitrate = Number(audioBitrate)
        if(this.constrains.audio && audioBitrate >=8 && audioBitrate<=500){
            this.properties.audioBitrate = audioBitrate
            this.changeSdpSettings({audio_bitrate: this.properties.audioBitrate})
        }
    }
    getVideoTrack(){
        let replacement = this.media_element.cloneNode(true)
        replacement.srcObject = new MediaStream(this.local_media_stream.getTracks())
        return replacement
    }
    getStream(){
        return this.local_media_stream
    }
    mixVideoTracks(toMix, current){
        let tag = current
        var canvas = document.createElement("canvas");
        let view_wview = 1280;
        let view_hview = 720;
        canvas.tabIndex = 0;
        var ctx = canvas.getContext("2d");
        canvas.height = view_hview;
        canvas.width = view_wview
        function draw()
        {
            ctx.drawImage(tag, 0, 0, view_wview, view_hview);
            ctx.drawImage(toMix, 0, 0, 300, 300);

            window.requestAnimationFrame(draw);
        }
        window.requestAnimationFrame(draw);
        return canvas.captureStream(30);
    }
    mixVideoSources(video){
        let old_track = this.local_media_stream.getVideoTracks()[0];
        this.getUserMedia({audio:false, video: { width: 1280, height: 720 }},(stream)=>{
            let videoForCanvas = document.createElement('video')
            videoForCanvas.srcObject = stream
            videoForCanvas.autoplay = true
            let mixed = this.mixVideoTracks(videoForCanvas,this.getVideoTrack());
            let tracks = [mixed.getVideoTracks()[0]]
            this.local_media_stream.getAudioTracks().map(t=>tracks.push(t))
            let new_stream = new MediaStream(tracks)
            this.media_element.srcObject = new_stream
            let track = mixed.getVideoTracks()[0]
            for(let peer in this.peers){
                if(!this.senders[peer]["video"]){
                    this.senders[peer]["video"] = {}
                }
                this.senders[peer][old_track.kind]["system"].replaceTrack(track)
            }
        })
    }
    requestAudio(){
        this.constrains.audio = true
        this.changeTracks({audio:true})
    }
    requestVideo(){
        this.constrains.video = true
        this.changeTracks(this.constrains)
    }
    setVideoBitrates(videoBitrate){
        if(this.constrains.video && videoBitrate >=8 && videoBitrate<=2000){
            this.properties.videoBitrate = videoBitrate
            this.changeSdpSettings({video_bitrate: this.properties.videoBitrate})
        }
    }
    hasVideo(){
        return this.video_devices.length != 0;
    }
    hasActiveAudio(){
        return this.local_media_stream.getAudioTracks().filter(t=>t.enabled).length != 0;
    }
    hasActiveVideo(){
        return this.local_media_stream.getVideoTracks().filter(t=>t.enabled).length != 0;
    }
    hasMutedAudio(){
        return this.local_media_stream.getAudioTracks().filter(t=>!t.enabled).length != 0;
    }
    hasMutedVideo(){
        return this.local_media_stream.getVideoTracks().filter(t=>!t.enabled).length != 0;
    }
    muteRelay(checkForSender){
        if(checkForSender){
            this.checkForSender(true)
        }
        this.attachMediaStream(this.media_element, this.local_media_stream, {returnElm: true}, (new_element, new_constrains)=>{
            this.media_element = new_element;
            this.constrains = new_constrains;
            this.media_element.muted = true;
            this.sendConstrains()
            if(this.onMediaNegotiationCallback){
                this.onMediaNegotiationCallback()
            }
        })
    }
    muteAudio(){
        let track = this.local_media_stream.getAudioTracks()[0]
        if(track){
            track.enabled = !track.enabled;
            let checkForSender = false
            if(track.enabled){
                checkForSender = true;                
            }
            this.muteRelay(checkForSender)
        }
    }
    muteVideo(){
        let track = this.local_media_stream.getVideoTracks()[0]
        if(track){
            track.enabled = !track.enabled;
            let checkForSender = false
            if(track.enabled){
                checkForSender = true;                
            }
            this.muteRelay(checkForSender)
        }
    }
    sendConstrains(){

        this.signaling_socket.emit('new_constrains', this.constrains)
    }
    checkForSender(replaceIfExist){
        for(let peer in this.peers){
            this.local_media_stream.getTracks().forEach(track =>{
                if(!this.senders[peer][track.kind]){
                    this.senders[peer][track.kind] = {}
                }
               
                if(track.label.includes('System') || track.label.includes('screen')){
                    if(this.senders[peer][track.kind]["system"] && replaceIfExist){
                        this.senders[peer][track.kind]["system"].replaceTrack(track)
                    }else{
                        this.senders[socket_id][track.kind]["system"] = this.peers[peer].addTrack(track, this.local_media_stream)
                    }
                }else{
                    if(this.senders[peer][track.kind]["user"] && replaceIfExist){
                        this.senders[peer][track.kind]["user"].replaceTrack(track)
                    }else{
                        this.senders[peer][track.kind]["user"] = this.peers[peer].addTrack(track,this.local_media_stream)
                    }
                }
            })
        }
    }
    changeSdpSettings(properties){
        for(let socket_id in this.peers){
            let peer_connection = this.peers[socket_id]
            this.negotiate(peer_connection, socket_id, this.properties)
        }
    }
    getMediaElement(){
        return this.media_element
    }
    getConstrains(){

        return this.constrains
    }
    getRoomDetails(callback){
        this.signaling_socket.emit('get_room_details', this.channel)
        this.regHandler('room_details', callback)
    }
    setOffers(constrains){
        this.offers.audio = true;
        this.offers.video = true;
    }
    setCocoInterval(interval,callback){
       setInterval(()=>{
            let frame = this.captureFrame();
            this.signaling_socket.emit('tensor', {'data': frame, 'width': this.media_element.width, 'height': this.media_element.height})
        },interval)
    }
    changeTracks(constrains){
        this.getUserMedia(constrains, (stream)=>{
            if(!this.constrains.audio) stream.getAudioTracks()[0] ?stream.getAudioTracks()[0].enabled = false : null
            if(!this.constrains.video) stream.getVideoTracks()[0] ?stream.getVideoTracks()[0].enabled = false : null
           
            stream.getTracks().forEach(track =>{
                this.local_media_stream.addTrack(track)
            })
            this.checkForSender(true)
            this.attachMediaStream(this.media_element, this.local_media_stream,{muted:true, returnElm: true}, (new_element,new_constrains)=>{
                this.constrains = new_constrains;
                this.media_element = new_element;
                this.media_element.muted = true
                this.sendConstrains()
                if(this.onMediaNegotiationCallback){
                    this.onMediaNegotiationCallback(new_constrains,this)
                }
            })
        })
    }
    changeVideoTrack(id, callback){
        this.local_media_stream.getVideoTracks().forEach(track=>{
            track.stop();
        })
        this.local_media_stream = new MediaStream(this.local_media_stream.getTracks().filter(t=>t.readyState != 'ended'))
        this.changeTracks({audio: false, video : {deviceId: { exact: id}}});
    }
    changeAudioTrack(id, callback){
        this.local_media_stream.getAudioTracks().forEach(track=>{
            track.stop();
        })
        this.local_media_stream = new MediaStream(this.local_media_stream.getTracks().filter(t=>t.readyState != 'ended'))
        this.changeTracks({audio: {deviceId: { exact: id}, video: false}})
    }
    getUserMedia(constrains,callback){
         navigator.mediaDevices.getUserMedia(constrains)
        .then(
            (stream) => {
               if(callback)
                    callback(stream)
        }).catch((e) => {
            console.log(e.message)
        })    
    }
    setupLocalMedia(constrains, callback) {
        this.getUserMedia(constrains, (stream)=>{
            let mEl = null;
            mEl = this.setupMedia(constrains, stream, { muted: true})
            this.media_element = mEl
            if(callback)
                callback(mEl,stream)
        })
    }
    setupScreen(details){
        this.media_element = document.createElement('video')
        this.media_element.srcObject = this.local_media_stream
        this.media_element.autoplay = 'autoplay'
        this.media_element.muted = true
        this.media_element.width = 1480;
        this.media_element.height = 1080;
        let v = this.local_media_stream.getVideoTracks()[0]
        let callback;
        if(details.type == 'conferent'){
            callback = (event) => {
                this.partChannel()
                if(this.onchannelleft){
                    this.onchannelleft()
                }
            }
        }else{
            callback = (event) => {
                this.muteVideo();
            }
        }
        v.onended = callback
    }
    createConnectDisconnectHandlers(callback){
        this.regConnectHandlers(()=> {
            this.getRoomDetails((details)=>{
                this.setOffers()
                if(this.is_screen_share){
                    navigator.mediaDevices.getDisplayMedia({video: true, audio: true}).then((stream)=>{
                        console.log(stream.getTracks())
                        if(stream.getAudioTracks().length==0){
                            this.constrains.audio = false;
                        }
                        this.local_media_stream = stream
                        this.constrains.screen = true;
                        this.setupScreen(details);
                        this.joinChannel(this.constrains)
                        callback(this.media_element)
                        if(details.type == 'streaming'){
                            cocoSsd.load().then(model => {
                                this.predictionsLoop()
                            });
                        }
                    })
                }else{
                    this.findConstrains(details.rules,()=>{
                        this.setupLocalMedia(this.constrains,
                        (mEl,stream) => {
                            this.local_media_stream = stream
                            this.joinChannel(this.constrains);
                            if(callback)
                                callback(mEl)
                        },
                        (e) => {
                            console.log("Couldn't set up media: " + e)
                        })
                    })
                }
            })
        })
    }
    predictionsLoop(){
        setInterval(()=>{
            this.predictor.detect(this.media_element).then(predictions => {
                this.signaling_socket.emit("topics", predictions);
            });
        }, 30000);
    }
}