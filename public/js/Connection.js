var ICE_SERVERS = [
    { url: "stun:stun.l.google.com:19302" }
];

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
        let new_constrains = {audio:should_constrain_audio, video: should_constrain_video}
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
        if (peer_connection._negotiating == true) return;
        peer_connection._negotiating = true;
        try {
            const offer = await peer_connection.createOffer();
        
            await peer_connection.setLocalDescription(offer);
            //offer.sdp = this.setProperties(offer.sdp,properties)
            this.signaling_socket.emit('relaySessionDescription',
            { 'socket_id': socket_id, 'session_description': offer, 'properties': properties});
        } catch (e) {
            reportError(e)
        } finally {
            peer_connection._negotiating = false;
        }
        
    }
    
    regAddPeer() {
        
        this.regHandler('addPeer', async(config) => {
            console.log(config.constrains)
            var socket_id = config.socket_id;
            if (socket_id in this.peers) {
                return;
            }
            var peer_connection = new RTCPeerConnection({
                sdpSemantics: 'unified-plan'
            });
           
            
            peer_connection.ontrack = (event) => {
                let stream = event.streams[0] || new MediaStream(peer_connection.getReceivers().map(receiver => receiver.track));
                 console.log(event)
                if (!this.peer_media_elements[socket_id]) {
                    this.attachMediaStream(null,stream,{muted: false}, (new_element, new_constrains)=>{
                        this.peer_media_elements[socket_id] = new_element
                        if(this.onBroadcasterCallback){
                            this.onBroadcasterCallback(this.peer_media_elements[socket_id], socket_id, config.constrains)
                        }  
                    })
                }else{
                    console.log(event)
                    this.addTrack(this.peer_media_elements[socket_id], stream)
                    this.attachMediaStream(this.peer_media_elements[socket_id],this.peer_media_elements[socket_id].srcObject,{ muted: false},
                    (new_element, new_constrains)=>{
                        this.peer_media_elements[socket_id] = new_element
                        if(this.onBroadcastNegotitaioncallback){
                            console.log(new_constrains)
                            this.onBroadcastNegotitaioncallback(new_constrains,new_element)
                        }
                    })
                } 
            }
            this.peers[socket_id] = peer_connection;
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
                this.senders[socket_id] = {}
                this.local_media_stream.getTracks().filter(t=>t.enabled).map((track) =>{
                        if(!this.senders[socket_id][track.kind]){
                            this.senders[socket_id][track.kind] = {}
                        }
                        if(track.label.includes('System') || track.label.includes('screen')){
                            this.senders[socket_id][track.kind]["system"] = peer_connection.addTrack(track, this.local_media_stream)
                        }else{
                            console.log(track)
                            this.senders[socket_id][track.kind]["user"] = peer_connection.addTrack(track, this.local_media_stream)
                        }

                });
            }
            if (config.should_create_offer) {
                this.negotiate(peer_connection, socket_id, this.properties)
            }
            this.signaling_socket.emit('ready-state', {socket_id: socket_id});
        })
    }
    regiceCandidate() {
        this.regHandler('iceCandidate', (config) => {
            console.log(config)
            this.peers[config.socket_id].addIceCandidate(new RTCIceCandidate(config.ice_candidate));
        })
    }
    sdp(sdp, media, bitrate){
        console.log(bitrate)
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
        mline++;
        lines.splice(mline,0,"b=AS:"+bitrate)
        return lines.join("\n")
    }
    setProperties(sdp, properties){
        if(properties.audioBitrate){
            return this.sdp(sdp, 'audio', properties.audioBitrate)
        }
        if(properties.videoBitrate){
            return this.sdp(sdp, 'video', properties.videoBitrate)
        }
        
        return sdp
    }
    regSessionDescriptor() {
        this.regHandler('sessionDescription', (config) => {
            console.log('pepega')
            var socket_id = config.socket_id;
            var peer_connection = this.peers[socket_id];
            if(!peer_connection){
                console.log('pepega')
                peer_connection = new RTCPeerConnection(
                    { "iceServers": ICE_SERVERS },
                    { "optional": [{ "DtlsSrtpKeyAgreement": true }] }
                );
                this.peers[socket_id] = peer_connection   
            }
            var remote_description = config.session_description;
            var desc = new RTCSessionDescription(remote_description);
            var stuff = peer_connection.setRemoteDescription(desc)
            .then(() => {
                if(!peer_connection.onnegotiationneeded){
                    peer_connection.onnegotiationneeded = async(event) =>{
                        this.negotiate(peer_connection, socket_id, config.properties)
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
    setupStream(stream, constrains){
        stream.getTracks().forEach((t)=>{
            if(t.kind == 'audio') t.enabled = constrains.audio;
            if(t.kind == 'video') t.enabled = constrains.video;
        })
    }
    regChangeConstrainsHandler(){
        this.signaling_socket.on('relayNewConstrains', (options)=>{

            if(this.peer_media_elements[options.socket_id]){
                let element = this.peer_media_elements[options.socket_id];
                this.setupStream(element.srcObject, options.constrains)
                this.attachMediaStream(element, element.srcObject, {returnElm: true}, (new_element, new_constrains)=>{
                    this.peer_media_elements[options.socket_id] = new_element;
                    if(this.onBroadcastNegotitaioncallback){
                        this.onBroadcastNegotitaioncallback(new_constrains,new_element)
                    }
                })
            }
        })
    }
    regConnectHandlers(callback) {
        this.regAddPeer();
        this.regiceCandidate();
        this.regSessionDescriptor();
        this.regRemovePeer();
        this.regChangeConstrainsHandler();

        this.regHandler('connect', () => {
            if (callback)
                callback()
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
        this.signaling_socket.emit('join', { "constrains": constrains, "id": this.id});
    }
    async findConstrains(rules,callback) {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            let use_audio, use_video = false
            let searchingFor = ''
            for (let i = 0; i < devices.length; i++) {
                if (devices[i].kind === 'audioinput') use_audio = true, this.audio_devices.push(devices[i]);
                if (devices[i].kind === 'videoinput') use_video = true, this.video_devices.push(devices[i]);
            }
            if(rules){
                if((!rules.audio && rules.audio != null) || !this.constrains.audio) {
                    this.constrains.audio = false
                }
                if((!rules.video && rules.video != null) || !this.constrains.video){
                    this.constrains.video = false
                }
            }else{
                if(this.constrains.audio && use_audio){
                    this.constrains.audio = use_audio;
                }
                if(this.constrains.video && use_video){
                    this.constrains.video = use_video
                }
            }
            callback()
        })
    }
    findWebRTC() {
        return (navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia)
    }


    setupMedia(constrains, stream, options) {
        let media = constrains.video ?
          document.createElement('video') :
          document.createElement('audio');
        media.autoplay = "autoplay"
        media.muted = options.muted 
        media.controls = "controls";
        media.srcObject = stream;
        return media
    }

}
