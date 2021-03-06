import Connection from "./Connection.js"


export default class Broadcaster extends Connection{
    constructor(IO,CONSTRAINS,ID){
        super(IO,ID)
        this.constrains = {};
        this.media_element = null
        this.audio_devices = []
        this.video_devices = []
        this.properties = {
            audioBitrate : 50,
            videoBitrate : 25
        }
        this.animationId = null;
        this.mixed_track = null
        
        this.constrains = CONSTRAINS
        this.interval;
        this.localMediaNegotiation = ()=>{
            let filtered = new MediaStream(this.local_media_stream.getTracks().filter(t=>t.enabled))
            this.attachMediaStream(this.media_element, filtered,{muted:true, returnElm: true}, (new_element,new_constrains)=>{
                this.constrains = new_constrains;
                this.media_element = new_element;
                this.media_element.muted = true
                this.sendConstrains()
                if(this.onMediaNegotiationCallback){
                    this.onMediaNegotiationCallback()
                }
            })
        }
        
        this.createConnectDisconnectHandlers = (callback)=>{
            this.regConnectHandlers(()=> {
                this.getRoomDetails((details)=>{
                    if(details.rules){
                        this.rules = details.rules
                        Object.defineProperty(this, 'rules', {configurable: false, writable: false});
                    }
                    if(this.constrains.screen){
                        this.findDevices(()=>{
                            this.getDisplayMedia({video: this.constrains.video, audio: this.constrains.audio}, (stream)=>{
                                if(stream.getAudioTracks().length==0){
                                    this.constrains.audio = false;
                                }else{
                                    this.constrains.audio = true
                                }
                                let settings = stream.getVideoTracks()[0].getSettings()

                                this.local_media_stream = stream
                                this.constrains.screen = true;
                                this.media_element = this.setupMedia(this.constrains,this.local_media_stream, {muted: true})
                                
                                this.joinChannel(this.constrains)
                                callback(this.media_element)
                            })
                        })
                    }else{
                        this.findConstrains(details.rules,()=>{
                            console.log(this.constrains)
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
                    if(details.type == 'streaming'){
                        
                        cocoSsd.load().then(model => {
                            this.interval = setInterval(()=>{
                                if(this.hasActiveVideo()){
                                    model.detect(this.media_element).then(predictions => {
                                    console.log(predictions)
                                    this.signaling_socket.emit("topics", predictions);
                                    });
                                }
                            }, details.tick);
                        });
                    }
                })
            })
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
        replacement.srcObject = new MediaStream(this.local_media_stream.getTracks().filter(t=>t.enabled))
        return replacement
    }
    getStream(){
        return this.local_media_stream
    }
    mixVideoTracks(toMix, current,x,y,w,h){
        let tag = current
        var canvas = document.createElement("canvas");
        let view_wview = window.screen.availWidth;
        let view_hview = window.screen.availHeight;
        canvas.tabIndex = 0;
        var ctx = canvas.getContext("2d");
        canvas.height = view_hview;
        canvas.width = view_wview
        let draw = ()=>{
            ctx.drawImage(tag, 0, 0, view_wview, view_hview);
            ctx.drawImage(toMix, x, y, w, h);

            this.animationId = window.requestAnimationFrame(draw);
        }
        this.animationId = window.requestAnimationFrame(draw);
        return canvas.captureStream(30);
    }
    mixVideoSources(new_constrains,screen, x,y,w,h){
        let old_track = this.local_media_stream.getVideoTracks().filter(t=>t.enabled)[0];
        let callback = (stream)=>{
            this.local_media_stream.addTrack(stream.getVideoTracks()[0])
            let videoForCanvas = document.createElement('video')
           
            videoForCanvas.srcObject = stream
            videoForCanvas.autoplay = true

            let mixed = this.mixVideoTracks(videoForCanvas,this.getVideoTrack(), x,y,w,h);
            let tracks = [mixed.getVideoTracks()[0]]
            this.local_media_stream.getAudioTracks().map(t=>tracks.push(t))

            let new_stream = new MediaStream(tracks)
            this.media_element.srcObject = new_stream
            if(this.onMediaNegotiationCallback){
                this.onMediaNegotiationCallback()
            }
            let track = mixed.getVideoTracks()[0]
            this.mixed_track = track
            for(let peer in this.peers){
                let video_sender = this.peers[peer].getSenders().filter(s=>s.track && s.track.kind == 'video')[0]
                video_sender.replaceTrack(track)
            }
        }
        if(screen){
            this.getDisplayMedia(new_constrains,callback)
        }else{
            this.getUserMedia(new_constrains,callback)
        }
        
    }
    requestScreen(constrains){
        if(!this.rules || this.rules.screen){
            this.getDisplayMedia(constrains, (stream)=>{
                this.constrains.video = true;
                this.constrains.screen = true;
                if(this.local_media_stream.getVideoTracks().filter(t=>!t.enabled) == 0){
                    this.changeProcedure(stream, {forceAdd: true})
                }else{
                    this.changeProcedure(stream, {replaceIfExist: true})
                }
            })
        }
    }
    requestAudio(){
        if(!this.rules || this.rules.audio){
            this.constrains.audio = true
            this.changeTracks({audio:true}, {forceAdd: true})
        }
    }
    requestVideo(){
       
        if(!this.rules || this.rules.video){
            this.constrains.video = true
            this.changeTracks(this.constrains,{forceAdd: true})
        }
    }
    setVideoBitrates(videoBitrate){
        if(this.constrains.video && videoBitrate >=8 && videoBitrate<=2000){
            this.properties.videoBitrate = videoBitrate
            this.changeSdpSettings({video_bitrate: this.properties.videoBitrate})
        }
    }
    isScreen(){
        return this.constrains.screen
    }
    hasVideo(){
        return this.video_devices.length != 0;
    }
    hasActiveAudio(){
        return this.local_media_stream.getAudioTracks().filter(t=>t.enabled).length != 0;
    }
    hasActiveCamera(){
        return this.local_media_stream.getVideoTracks().filter(t=>!t.label.includes('screen') && t.enabled).length != 0
    }
    hasMutedCamera(){
        return this.local_media_stream.getVideoTracks().filter(t=>!t.label.includes('screen') && !t.enabled).length != 0
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
            this.checkForSender({replaceIfExist: true})
        }
        this.localMediaNegotiation()
    }
    muteAudio(){
        let track = this.local_media_stream.getAudioTracks()[0]
        if(track){
            track.enabled = !track.enabled;
            this.muteRelay(track.enabled)
        }
    }
    muteVideo(){
        if(!this.animationId){
            let track = this.local_media_stream.getVideoTracks().filter(t=>!t.label.includes('screen'))[0]
            if(track){
                track.enabled = !track.enabled;
                this.muteRelay(track.enabled)
            }
        }else{
            cancelAnimationFrame(this.animationId)
            this.animationId = null;
            this.mixed_track = null
            this.local_media_stream.getVideoTracks().filter(t=>!t.label.includes('screen')).map(t=>t.stop())
            this.local_media_stream = new MediaStream(this.local_media_stream.getTracks().filter(t=>t.readyState!='ended'))
            this.media_element.srcObject = this.local_media_stream
            if(this.onMediaNegotiationCallback){
                this.onMediaNegotiationCallback()
            }
            this.checkForSender({replaceIfExist: true})
        }
    }
    sendConstrains(){
        
        this.signaling_socket.emit('new_constrains', this.constrains)
    }
    checkForSender(options){
        for(let peer in this.peers){
            this.local_media_stream.getTracks().filter(t=> t.enabled).forEach(track =>{
                let senders = this.peers[peer].getSenders().filter(s=>s.track)
                if(senders.length == 0){
                    this.peers[peer].addTrack(track, this.local_media_stream)
                    return
                }
                
                for(let sender of senders){
                    if(sender.track){
                        if(sender.track.kind == track.kind && options.replaceIfExist){
                            sender.replaceTrack(track)
                            break;
                        }
                        if(sender.track.id != track.id && options.forceAdd){
                            this.peers[peer].addTrack(track, this.local_media_stream)
                            break;
                        }
                    }
                }
            })
        }
    }
    changeSdpSettings(properties){
        this.signaling_socket.emit('new_properties', {properties: this.properties})
        for(let socket_id in this.peers){
            let peer_connection = this.peers[socket_id]
            this.negotiate(peer_connection, socket_id, this.peers[socket_id].properties)
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
        this.regHandler('room_details', (data)=>{
            callback(data)
        })
    }
    setCocoInterval(interval,callback){
       setInterval(()=>{
            let frame = this.captureFrame();
            this.signaling_socket.emit('tensor', {'data': frame, 'width': this.media_element.width, 'height': this.media_element.height})
        },interval)
    }
   
    changeProcedure(stream, options){
        stream.getTracks().forEach(track =>{
            this.local_media_stream.addTrack(track)
        })
        this.checkForSender(options)
        this.localMediaNegotiation()
    }
    changeTracks(constrains, options){
        this.getUserMedia(constrains, (stream)=>{
            if(!this.constrains.audio) stream.getAudioTracks()[0] ?stream.getAudioTracks()[0].enabled = false : null
            if(!this.constrains.video) stream.getVideoTracks()[0] ?stream.getVideoTracks()[0].enabled = false : null
           
            this.changeProcedure(stream, options)
        })
    }
    changeVideoTrack(id, callback){
        this.local_media_stream.getVideoTracks().filter(t=>!t.label.includes('screen')).forEach(track=>{
            track.stop();
        })
        this.local_media_stream = new MediaStream(this.local_media_stream.getTracks().filter(t=>t.readyState != 'ended'))
        this.changeTracks({audio: false, video : {deviceId: { exact: id}}},{replaceIfExist: true});
    }
    changeAudioTrack(id, callback){
        this.local_media_stream.getAudioTracks().filter(t=>!t.label.includes('System')).forEach(track=>{
            track.stop();
        })
        this.local_media_stream = new MediaStream(this.local_media_stream.getTracks().filter(t=>t.readyState != 'ended'))
        this.changeTracks({audio: {deviceId: { exact: id}, video: false}},{replaceIfExist:true})
    }
    getUserMedia(constrains,callback){
        console.log(constrains)
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
        console.log(constrains)
        this.getUserMedia(constrains, (stream)=>{
            let mEl = null;
            mEl = this.setupMedia(constrains, stream, { muted: true})
            this.media_element = mEl
            if(this.audio_devices.filter(t=>t.label.length ==0) !=0 || this.video_devices.filter(t=>t.label.length ==0)!= 0){
                this.audio_devices = []
                this.video_devices = []
                this.findDevices(()=>{
                    if(callback)
                        callback(mEl,stream)    
                })
            }else{
                if(callback)
                    callback(mEl,stream)
            }
        })
    }
    setupScreen(details){
        this.media_element = document.createElement('video')
        this.media_element.srcObject = this.local_media_stream
        this.media_element.autoplay = 'autoplay'
        this.media_element.muted = true
    }
    getDisplayMedia(constrains, callback){

        navigator.mediaDevices.getDisplayMedia(constrains).then((stream)=>{

            stream.getVideoTracks()[0].addEventListener('ended', ()=>{
                this.local_media_stream = new MediaStream(this.local_media_stream.getTracks().filter(t=>t.readyState!='ended'))
                this.constrains.screen = false;
                if(this.animationId){
                    cancelAnimationFrame(this.animationId)
                    this.mixed_track = null
                    this.animationId = null;
                }
                for(let peer in this.peers){
                    let video_sender = this.peers[peer].getSenders().filter(s=>s.track && s.track.kind == 'video')[0]
                    video_sender.replaceTrack(this.local_media_stream.getVideoTracks()[0])
                }
                this.localMediaNegotiation()
            })
            callback(stream)
        }).catch((e)=>{
            console.log(e)
        })
    }
}