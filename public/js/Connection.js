var ICE_SERVERS = [
    { url: "stun:stun.l.google.com:19302" }
];

export default class Connection {
    constructor(SIGNALING_SERVER,socket, id) {
        this.signaling_server = SIGNALING_SERVER;
        this.signaling_socket = socket
        this.id = id
        this.peers = {};
        this.peer_media_elements = {};
        this.onBroadcasterCallback = null
        this.onPeerDiscconectCallback = null
        this.onMediaNegotiationCallback = null;
        this.onBroadcastnegotitaion = null;
    }
    
    subscribeTo(CHANNEL, callback){
        this.channel = CHANNEL
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
                new_element = this.setup_media(new_constrains,stream,options)
                
            }else{
                stream.getTracks().forEach(t=>{
                    element.srcObject.addTrack(t)
                })
                new_element = element
            }
        }else{
            new_element = this.setup_media(new_constrains,stream,options)
        }
        if(callback)
            callback(new_element,new_constrains)
    }
    addTrack(id, stream){

        let element = this.peer_media_elements[id]
        let old_tracks = element.srcObject.getTracks()
        old_tracks.forEach((t)=>{
            stream.addTrack(t)    
        })

        this.attachMediaStream(element, stream,{muted:false, returnElm: true}, (new_element,new_constrains)=>{
            this.peer_media_elements[id] = new_element
            
            if(this.onBroadcastNegotitaioncallback){
                this.onBroadcastNegotitaioncallback(new_constrains,new_element)
            }
        })
    }
    async negotiate(peer_connection, socket_id){
        
        if (peer_connection._negotiating == true) return;
        
        peer_connection._negotiating = true;
        try {
            
            const offer = await peer_connection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
            await peer_connection.setLocalDescription(offer);
    
            
            this.signaling_socket.emit('relaySessionDescription',
            { 'socket_id': socket_id, 'session_description': peer_connection.localDescription});
        } catch (e) {
            reportError(e)
        } finally {
            peer_connection._negotiating = false;
        }
        
    }
    
    regAddPeer() {
        
        this.regHandler('addPeer', async(config) => {
            var socket_id = config.socket_id;
            if (socket_id in this.peers) {
                return;
            }
            var peer_connection = new RTCPeerConnection(
                { "iceServers": ICE_SERVERS },
                { "optional": [{ "DtlsSrtpKeyAgreement": true }] }
            );

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

            peer_connection.ontrack = (event) => {
                if (this.peer_media_elements[socket_id] != undefined) {
                    this.addTrack(socket_id, event.streams[0])
                    return;
                }
                this.setupStream(event.streams[0], config.constrains)
                this.attachMediaStream(null,event.streams[0],{returnElm: true, muted: false, constrains: config.constrains}, (new_element, new_constrains)=>{
                    this.peer_media_elements[socket_id] = new_element
                })

                this.onBroadcasterCallback(this.peer_media_elements[socket_id], socket_id, config.constrains)
            }
            if (this.constrains != null) {
                this.local_media_stream.getTracks().forEach((track) =>{
                    if(!this.senders[socket_id][track.kind]){
                        this.senders[socket_id][track.kind] = {}
                    }
                    this.senders[socket_id][track.kind][track.label] = peer_connection.addTrack(track, this.local_media_stream)
                });
            }
            if (config.should_create_offer) {
               peer_connection.onnegotiationneeded = async(event) =>{
                    this.negotiate(peer_connection, socket_id)
               }
            }
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
        mline++;
        lines.splice(mline,0,"b=AS:"+bitrate)
        return lines.join("\n")
    }
    setProperties(sdp, properties){
        if(properties.audio_bitrate){
            return this.sdp(sdp, 'audio', properties.audio_bitrate)
        }
        if(properties.video_bitrate){
            return this.sdp(sdp, 'video', properties.video_bitrate)
        }
        
        return sdp
    }
    regSessionDescriptor() {
        this.regHandler('sessionDescription', (config) => {
            var socket_id = config.socket_id;
            var peer = this.peers[socket_id];
            var remote_description = config.session_description;
            var desc = new RTCSessionDescription(remote_description);
            var stuff = peer.setRemoteDescription(desc,
                () => {
                    if (remote_description.type == "offer") {
                        console.log('answer')
                        peer.createAnswer()
                            .then((local_description)=>{
                                peer.onnegotiationneeded = async(event) =>{
                                    this.negotiate(peer, socket_id)
                                }
                                if(config){
                                    if(config.properties){
                                        console.log('wut')
                                        let before = local_description.sdp
                                        local_description.sdp = this.setProperties(local_description.sdp, config.properties)
                                    }
                                   return  peer.setLocalDescription(local_description)
                                }
                            }).then(()=>{
                                this.signaling_socket.emit('relaySessionDescription',
                                            { 'socket_id': socket_id, 'session_description': peer.localDescription });
                            }).catch((e)=>{
                                console.log(e.message)
                            })
                    }
                },
                (error) => {
                    console.log("setRemoteDescription error: ", error);
                }
            );
        });
    }
    setupStream(stream, constrains){
        stream.getTracks().forEach((t)=>{
            if(t.kind == 'audio') t.enabled = constrains.audio
            if(t.kind == 'video') t.enabled = constrains.video
        })
    }
    regChangeConstrainsHandler(){
        this.signaling_socket.on('relayNewConstrains', (options)=>{
            let element = this.peer_media_elements[options.socket_id];
            this.setupStream(element.srcObject, options.constrains)
            this.attachMediaStream(element, element.srcObject, {returnElm: true}, (new_element, new_constrains)=>{
                this.peer_media_elements[options.socket_id] = new_element;
                if(this.onBroadcastNegotitaioncallback){
                    this.onBroadcastNegotitaioncallback(new_constrains,new_element)
                }
            })
        })
    }
    regConnectHandler(callback) {
        this.regiceCandidate();
        this.regSessionDescriptor();
        this.regRemovePeer();
        this.regChangeConstrainsHandler();
        this.regAddPeer();

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
                //delete this.senders[config.socket_id]
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
    part_channel() {
        this.signaling_socket.emit('part', 'let me out');
    }
    join_channel(constrains) {
        this.signaling_socket.emit('join', { "constrains": constrains , "channel": this.channel, "id": this.id});
    }
    async findConstrains(rules,callback) {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            let use_audio, use_video = false
            let searchingFor = ''
            for (let i = 0; i < devices.length; i++) {
                if (devices[i].kind === 'audioinput') use_audio = true, this.audioDevices.push(devices[i]);
                if (devices[i].kind === 'videoinput') use_video = true, this.videoDevices.push(devices[i]);
            }
            if((!rules.audio && rules.audio != null) || !this.constrains.audio) {
                this.constrains.audio = false
            }
            if((!rules.video && rules.video != null) || !this.constrains.video){
                this.constrains.video = false
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


    setup_media(constrains, stream, options) {
        let media = constrains.video ?
          document.createElement('video') :
          document.createElement('audio');
        media.autoplay = "autoplay"
        media.muted = options.muted 
        media.controls = "controls";
        media.srcObject = stream;
        if (options.returnElm) return media
    }

}
