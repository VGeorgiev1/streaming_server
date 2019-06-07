export default class Connection {
    constructor(io, id) {
        this.channel = channel;
        this.id = id
        
        this.peers = {};
        this.peer_media_elements = {};
        this.onBroadcasterCallback = null
        this.onPeerDiscconectCallback = null
        this.onMediaNegotiationCallback = null;
        this.onBroadcastnegotitaion = null;
        this.onchannelleft = null;
    }
    
    subscribeTo(channel, callback){
        this.channel = channel
        this.signaling_socket = io('/' + this.channel);
        this.createConnectDisconnectHandlers(callback)
    }
    onBroadcastNegotiation(callback){
        this.onBroadcastNegotitaioncallback = callback;
    }
    onMediaNegotion(callback){
        this.onMediaNegotiationCallback = callback
    }
    onBroadcaster(callback){
        this.onBroadcasterCallback = callback
    }
    onChannelLeft(callback){
        this.onchannelleft = callback
    }
    onPeerDiscconect(callback){
        this.onPeerDiscconectCallback = callback
    }

    attachMediaStream(element, stream,options, callback) {

        let should_constrain_audio = stream.getAudioTracks().filter(t => t.enabled).length != 0 
        let should_constrain_video = stream.getVideoTracks().filter(t => t.enabled).length != 0
        let should_constrain_screen = stream.getVideoTracks().filter(t => t.label.includes('screen')).length != 0
        let new_constrains = {audio:should_constrain_audio, video: should_constrain_video, screen: should_constrain_screen}
        let new_element;
        if(element != null){
            if((new_constrains.video && element.nodeName == 'AUDIO') ||
            (!new_constrains.video && element.nodeName == 'VIDEO')){
                new_element = this.setupMedia(new_constrains,stream,options)
            }else{
                new_element = element
                new_element.srcObject = stream
            }
        }else{
            new_element = this.setupMedia(new_constrains,stream,options)
        }
        if(callback)
            callback(new_element,new_constrains)
    }
    addTrack(element, stream){
        stream.getTracks().forEach((t)=>{
            element.srcObject.addTrack(t)
        })
    }
    async negotiate(peer_connection, socket_id, properties){
        peer_connection._negotiating = false;
        try {
            if (peer_connection._negotiating == true || peer_connection.signalingState != 'stable') return;
            const offer = await peer_connection.createOffer({offerToReceiveAudio: true, offerToReceiveVideo: true});
            await peer_connection.setLocalDescription(offer);
            if(properties){
                offer.sdp = this.setProperties(offer.sdp,properties);
            }
            this.signaling_socket.emit('relaySessionDescription',
            { 'socket_id': socket_id, 'session_description': offer, 'properties': this.properties});
        } catch (e) {
            console.log(e)
        } finally {
            peer_connection._negotiating = true;
        }
        
    }
    regAddPeer() {
        
        this.regHandler('addPeer', async(config) => {
            var socket_id = config.socket_id;
            if (socket_id in this.peers) {
                return;
            }
            var peer_connection = new RTCPeerConnection({
                sdpSemantics: 'unified-plan'
            });
           
            peer_connection.ontrack = (event) => {
                let stream = event.streams[0] || new MediaStream(peer_connection.getReceivers().map(receiver => receiver.track));
                if (!this.peer_media_elements[socket_id]) {
                    this.attachMediaStream(null,stream,{muted: false}, (new_element, new_constrains)=>{
                        this.peer_media_elements[socket_id] = new_element
                        if(this.onBroadcasterCallback){
                            this.onBroadcasterCallback(socket_id, new_constrains, this.peer_media_elements[socket_id])
                        }  
                    })
                }else{
                    this.addTrack(this.peer_media_elements[socket_id], stream)
                    this.attachMediaStream(this.peer_media_elements[socket_id],this.peer_media_elements[socket_id].srcObject,{ muted: false},
                    (new_element, new_constrains)=>{
                        this.peer_media_elements[socket_id] = new_element
                        if(this.onBroadcastNegotitaioncallback){

                            this.onBroadcastNegotitaioncallback(socket_id, new_constrains,new_element)
                        }
                    })
                } 
            }
            
            this.peers[socket_id] = peer_connection;
            this.peers[socket_id].properties = config.properties
            this.peers[socket_id].constrains = config.constrains
            if(config.media_state){
                this.peers[socket_id].media_state = config.media_state
            }


            peer_connection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.signaling_socket.emit('relayICECandidate', {
                        'socket_id': socket_id,
                        'ice_candidate': {
                            'sdpMLineIndex': event.candidate.sdpMLineIndex,
                            'candidate': event.candidate.candidate
                        }
                    });
                }
            }
            if (this.constrains != null) {
                this.local_media_stream.getAudioTracks().map(track=>{
                    peer_connection.addTrack(track, this.local_media_stream);
                })
                if(this.mixed_track){
                    peer_connection.addTrack(this.mixed_track) 
                }else if(this.local_media_stream.getVideoTracks().filter(t=>t.enabled)[0]){    
                    peer_connection.addTrack(this.local_media_stream.getVideoTracks()[0], this.local_media_stream); 
                }
            }
            if (config.should_create_offer) {
                if(this.constrains != null){
                    peer_connection.onnegotiationneeded = async(event) =>{
                        this.negotiate(peer_connection, socket_id, this.peers[socket_id].properties)
                    }
                }else{
                    this.negotiate(peer_connection, socket_id,this.peers[socket_id].properties)
                }
            }
            this.signaling_socket.emit('ready-state', {socket_id: socket_id, properties: this.properties});
        })
    }
    regiceCandidate() {
        this.regHandler('iceCandidate', (config) => {
            this.peers[config.socket_id].addIceCandidate(new RTCIceCandidate(config.ice_candidate));
        })
    }
    sdp(sdp, media, bitrate){

        var lines = sdp.split("\n");
        let matchMedia = new RegExp("m="+media)
        let matches = matchMedia.exec(sdp)
        if(matches == null) return sdp;
        let mline = 0;
        for (var i = 0; i < lines.length; i++) {
            if (matchMedia.exec(lines[i]) != null) {
                mline = i
                break;
            }
        }
        mline+=2;
        lines.splice(mline,0,"b=AS:"+bitrate)
        return lines.join("\n")
    }
    setProperties(sdp, properties){
        if(properties.audioBitrate){
          
          sdp = this.sdp(sdp, 'audio', properties.audioBitrate)
        }
        if(properties.videoBitrate){
          sdp = this.sdp(sdp, 'video', properties.videoBitrate)
        }
        return sdp
    }
    regSessionDescriptor() {
        this.regHandler('sessionDescription', (config) => {
            var socket_id = config.socket_id;
            var peer_connection = this.peers[socket_id];
            this.peers[socket_id].properties = config.properties;
            
            if(!peer_connection){
                peer_connection = new RTCPeerConnection({
                    sdpSemantics: 'unified-plan'
                });
                this.peers[socket_id] = peer_connection   
            }
            var remote_description = config.session_description;
            
            var desc = new RTCSessionDescription(remote_description);
            if(remote_description.type == "answer" && this.peers[socket_id].properties){
                desc.sdp = this.setProperties(desc.sdp, this.peers[socket_id].properties)
            }
            var stuff = peer_connection.setRemoteDescription(desc)
            .then(() => {
                if(!peer_connection.onnegotiationneeded){
                    peer_connection.onnegotiationneeded = async(event) =>{
                        this.negotiate(peer_connection, socket_id, this.peers[socket_id].properties)
                    }
                }
                if (remote_description.type == "offer") {
                    let offer;
                    peer_connection.createAnswer()
                        .then((local_description)=>{
                            offer = local_description
                            if(config.properties){ 
                                local_description.sdp = this.setProperties(local_description.sdp, config.properties)
                            }
                            return  peer_connection.setLocalDescription(local_description)
                        }).then(()=>{
                            this.signaling_socket.emit('relaySessionDescription',
                                { 'socket_id': socket_id, 'session_description':offer, 'properties': this.properties});
                       }).catch((e)=>{
                            console.log(e.message)
                        })
                }else{
                    console.log(remote_description.type)
                }
            })
            .catch((error) => {
                console.log("setRemoteDescription error: ", error);
            })
        });
    }
    regChangeConstrainsHandler(){
        this.signaling_socket.on('relayNewConstrains', (options)=>{
            
            if(this.peer_media_elements[options.socket_id]){
                this.peers[options.socket_id].constrains = options.constrains
                let element = this.peer_media_elements[options.socket_id];

                element.srcObject.getTracks().forEach((t)=>{
                    if(t.kind == 'audio'){ t.enabled = options.constrains.audio};
                    if(t.kind == 'video'){ t.enabled = options.constrains.video};
                })

                this.attachMediaStream(element, element.srcObject, {returnElm: true}, (new_element, new_constrains)=>{
                    this.peer_media_elements[options.socket_id] = new_element;
                    if(this.onBroadcastNegotitaioncallback){
                        this.onBroadcastNegotitaioncallback(options.socket_id,options.constrains,new_element)
                    }
                })
            }
        })
    }
    regConnectHandlers(callback) {
        this.regiceCandidate();
        this.regSessionDescriptor();
        this.regRemovePeer();
        this.regChangeConstrainsHandler();
                this.regAddPeer();

        this.regHandler('connect', () => {
            if (callback)
                callback()
        })
        this.regHandler('disconnect', ()=>{
            for(let peer in this.peers){
                //this.peers[peer].stop()
                this.onPeerDiscconectCallback(peer)
            }
            
        })
    }
    regRemovePeer() {
        this.regHandler('removePeer', (config) => {
            if(config.socket_id in this.peers){
                this.peers[config.socket_id].close();
                delete this.peers[config.socket_id];
            }
            if(this.onPeerDiscconectCallback)
                this.onPeerDiscconectCallback(config.socket_id)
        })
    }
    getSocket(){
        return this.signaling_socket;
    }
    regHandler(event, callback) {
        this.signaling_socket.on(event, callback);
    }
    partChannel() {
        this.signaling_socket.emit('part', {socket_id: this.signaling_socket.id});
    }
    joinChannel(constrains) {
        this.signaling_socket.emit('join', { "constrains": constrains, "id": this.id, 'properties': this.properties});
    }
    findDevices(callback){
        navigator.mediaDevices.enumerateDevices().then(devices => {
           
            
            for (let i = 0; i < devices.length; i++) {
                if (devices[i].kind === 'audioinput')  this.audio_devices.push(devices[i]);
                if (devices[i].kind === 'videoinput')  this.video_devices.push(devices[i]);
            }
            callback()
        })
    }
    async findConstrains(rules,callback) {
        
        this.findDevices(()=>{
            if(rules){
                if((!rules.audio && rules.audio != null) || !this.constrains.audio) {
                    this.constrains.audio = false
                }
                if((!rules.video && rules.video != null) || !this.constrains.video){
                    this.constrains.video = false
                }
            }else{
                if(this.constrains.audio){
                    this.constrains.audio = this.audio_devices.length != 0;
                }
                if(this.constrains.video){
                    this.constrains.video =  this.video_devices.length != 0;
                }
            }
           
            callback()
        })
        
    }


    setupMedia(constrains, stream, options) {
        let media = null;
        if(constrains.video || constrains.screen) {
            media = document.createElement('video')
            let settings = stream.getVideoTracks()[0].getSettings()
            media.width = settings.width
            media.height = settings.height
        }else{
            media = document.createElement('audio');
        }
        media.autoplay = "autoplay"
        media.muted = options.muted 
        media.controls = "controls";
        media.srcObject = stream;
        return media
    }

}
