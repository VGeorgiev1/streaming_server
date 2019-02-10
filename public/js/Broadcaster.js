import Connection from "./Connection.js"
const img = document.getElementById('img');


export default class Broadcaster extends Connection{
    constructor(SIGNALING_SERVER,socket,CONSTRAINTS,id){
        super(SIGNALING_SERVER,socket,id)
        this.constrains = {};
        this.audioBitrate = 50
        this.videoBitrate = 256
        this.media_element = null
        this.tracks = {}
        this.senders = {}
        this.audioDevices = []
        this.videoDevices = []
        this.offers = {}
        if(CONSTRAINTS != 'screen-share'){
            CONSTRAINTS ? (
                      this.constrains.video = CONSTRAINTS.video,
                      this.constrains.audio = CONSTRAINTS.audio)
                      : this.constrains = null
            this.local_media_stream = null
        }else{
            this.is_screen_share = true
            this.constrains.video = true
            this.constrains.audio = true
            this.local_media_stream = document.getElementById('screen').srcObject
            //document.getElementById('screen').remove();
        }
    
    }
    
    getAudioDevices(){
        return this.audioDevices;
    }
    getVideoDevices(){
        return this.videoDevices;
    }
    setAudioBitrates(audioBitrate) {
        if(this.constrains.audio && audioBitrate >=8 && audioBitrate<=500){
            this.audioBitrate = audioBitrate

            this.changeSdpSettings({audio_bitrate: this.audioBitrate})
        }
    }
    getVideoTrack(){
        return this.media_element
    }
    requestVideo(){
        this.getUserMedia({audio:false, video: true}, (stream)=>{
            let track = stream.getVideoTracks()[0]
            this.local_media_stream.addTrack(track)
            for(let peer in this.peers){
                if(!this.senders[peer][track.kind]){
                    this.senders[peer][track.kind] = {}
                }
                this.senders[peer][track.kind][track.label] = this.peers[peer].addTrack(track,this.local_media_stream)
            }
            this.attachMediaStream(this.media_element, this.local_media_stream, {returnElm: true}, (new_element, new_constrains)=>{
                this.media_element = new_element;
                this.constrains = new_constrains;
                this.sendConstrains()
                if(this.onMediaNegotiationCallback){
                    this.onMediaNegotiationCallback()
                }
            })
        })
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
            let track = mixed.getVideoTracks()[0]
            for(let peer in this.peers){
                if(!this.senders[peer]["video"]){
                    this.senders[peer]["video"] = {}
                }
                this.senders[peer][old_track.kind][old_track.label].replaceTrack(track)
            }
        })
    }
    requestAudio(){
        //if(this.local_media_stream.getAudioTracks().length != 0) return 0;
        this.getUserMedia({audio:true, video: false}, (stream)=>{
            let track = stream.getAudioTracks()[0]
            this.local_media_stream.addTrack(track)
            for(let peer in this.peers){
                if(!this.senders[peer][track.kind]){
                    this.senders[peer][track.kind] = {}
                }
                this.senders[peer][track.kind][track.label] = this.peers[peer].addTrack(track,this.local_media_stream)
            }
        })
    }
    setVideoBitrates(videoBitrate){
        console.log(this.constrains.video)
        if(this.constrains.video && videoBitrate >=8 && videoBitrate<=2000){
            this.videoBitrate = videoBitrate
            this.changeSdpSettings({video_bitrate: this.videoBitrate})
        }
    }
    hasVideo(){
        return this.videoDevices.length != 0;
    }
    hasActiveVideo(){
        return this.local_media_stream.getVideoTracks().length != 0;
    }
    mute_audio(){
        let tracks = this.local_media_stream.getAudioTracks()
        if(tracks){
            tracks[0].enabled = !tracks[0].enabled;
            this.constrains = {audio:tracks[0].enabled, video: this.constrains.video}

            this.attachMediaStream(this.media_element, this.local_media_stream, {returnElm: true}, (new_element, new_constrains)=>{
                this.media_element = new_element;
                this.constrains = new_constrains;
                console.log(this.constrains)
                console.log(this.media_element)
                this.sendConstrains()
                if(this.onMediaNegotiationCallback){
                    this.onMediaNegotiationCallback()
                }
            })
        }
      
    }
    sendConstrains(){
        let payload = {constrains: this.constrains, socket_id: this.signaling_socket.id}
        this.signaling_socket.emit('new_constrains', payload)
    }
    mute_video(){
        let tracks = this.local_media_stream.getVideoTracks()
        
        if(tracks){
            tracks[0].enabled = !tracks[0].enabled;
            this.constrains = {audio:this.constrains.audio, video: tracks[0].enabled}

            this.attachMediaStream(this.media_element, this.local_media_stream, {returnElm: true}, (new_element, new_constrains)=>{
                this.media_element = new_element;
                this.constrains = new_constrains;
                this.sendConstrains()
                if(this.onMediaNegotiationCallback){
                    this.onMediaNegotiationCallback()
                }
            })
        }

    }
    changeSdpSettings(properties){
        for(let peerId in this.peers){
            let peer_connection = this.peers[peerId]
            let disc
            peer_connection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
                .then((local_description)=>{
                    return peer_connection.setLocalDescription(local_description)
                })
                .then(()=>{
                    peer_connection.localDescription.sdp = this.setProperties(peer_connection.localDescription.sdp, properties)
   
                    this.signaling_socket.emit('relaySessionDescription',
                        { 'socket_id': peerId, 'session_description': peer_connection.localDescription , "properties": properties})
                })
                .catch((e)=>{
                    console.log(e.message)
            })
        }
    }
    getMediaElement(){
        return this.media_element
    }
    getConstrains(){
        return this.constrains
    }
    getRoomAndRules(callback){
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
            for(let peer in this.peers){
                stream.getTracks().forEach(track =>{
                    this.local_media_stream.addTrack(track)
                    if(!this.senders[peer][track.kind]){
                        this.senders[peer][track.kind] = {}
                    }
                    if(track.kind.includes('System') || track.kind.includes('screen')){
                        if(this.senders[peer][track.kind]["system"]){
                            this.senders[peer][track.kind]["system"].replaceTrack(track)
                        }else{
                            this.senders[socket_id][track.kind]["system"] = peer_connection.addTrack(track, this.local_media_stream)
                        }
                    }else{
                        if(this.senders[peer][track.kind]["user"]){
                            this.senders[peer][track.kind]["user"].replaceTrack(track)
                        }else{
                            this.senders[peer][track.kind]["user"] = this.peers[peer].addTrack(track,stream)
                        }
                    }

                })
            }
            
            this.attachMediaStream(this.media_element, stream,{muted:false, returnElm: true}, (new_element,new_constrains)=>{
                this.constrains = new_constrains;
                this.media_element = new_element;
                this.sendConstrains()
                if(this.onMediaNegotiationCallback){
                    this.onMediaNegotiationCallback(new_constrains,this)
                }
            })
        })
    }
    changeVideoTrack(id, callback){
        console.log(id)
        this.changeTracks({audio: this.constrains.audio, video : {deviceId: { exact: id}}});
    }
    changeAudioTrack(id, callback){
        this.changeTracks({audio: {deviceId: { exact: id}, video: this.constrains.video}})
    }
    getUserMedia(constrains,callback,errorback){
         navigator.mediaDevices.getUserMedia(constrains)
        .then(
            (stream) => {
               if(callback)
                    callback(stream)
        }).catch((e) => {
            console.log(e.message)//errorback(e.message)
        })    
    }
    setup_local_media(constrains, callback, errorback) {
        
        this.getUserMedia(constrains, (stream)=>{
            let mEl = null;
            if (this instanceof Broadcaster) {
                mEl = this.setup_media(constrains, stream, { muted: true, returnElm: true })
                this.media_element = mEl
            }
            if(callback)
                callback(mEl,stream)
        }, (msg)=>{console.log(msg)})
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
                this.part_channel()
                if(this.onchannelleft){
                    this.onchannelleft()
                }
            }
        }else{
            callback = (event) => {
                this.mute_video();
            }
        }
        v.onended = callback
    }
    createConnectDisconnectHandlers(callback){
        this.regConnectHandler(()=> {

            this.getRoomAndRules((details)=>{
                this.setOffers()
                if(this.is_screen_share){
                    document.getElementById('screen').remove();
                    this.constrains.screen = true;
                    this.setupScreen(details);
                    this.join_channel(this.constrains)
                    callback(this.media_element)
                    if(details.streaming){
                        cocoSsd.load().then(model => {
                            this.predictor = model
                            this.predictionsLoop()
                        });
                    }
                }else{
                    if (this.local_media_stream != null) {  
                        return; 
                    }
                    this.findConstrains(details.rules,()=>{
                        this.setup_local_media(this.constrains,
                        (mEl,stream) => {
                            this.local_media_stream = stream
                            this.join_channel(this.constrains);
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