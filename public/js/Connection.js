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
        
        let new_constrains = {audio:stream.getAudioTracks().filter(t => t.enabled).length != 0, video: stream.getVideoTracks().filter(t => t.enabled).length != 0 }
        let new_element;
        if(element != null){
            
            if((new_constrains.video && element.nodeName == 'AUDIO') ||
            (!new_constrains.video && element.nodeName == 'VIDEO')){
                new_element = this.setup_media(new_constrains,stream,options)
            
            }else{
                element.srcObject = stream;
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
            this.setOffersAnd
            if(this.onBroadcastNegotitaioncallback){
                this.onBroadcastNegotitaioncallback(new_constrains,new_element)
            }
        })
    }
    negotiate(peer_connection, socket_id){
        
        peer_connection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true})
        .then((local_description)=>{
            return peer_connection.setLocalDescription(local_description)
        })
        .then(()=>{
            this.signaling_socket.emit('relaySessionDescription',
            { 'socket_id': socket_id, 'session_description': peer_connection.localDescription});
        })
        .catch((e)=>{
            console.log(e.message)
        })
    }
    regAddPeer() {
        
        this.regHandler('addPeer', (config) => {
            var socket_id = config.socket_id;
            if (socket_id in this.peers) {
                return;
            }
            console.log(config)
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
                if (this.peer_media_elements[socket_id]) {
                    this.addTrack(socket_id, event.streams[0])
                    return;
                }
                this.setupStream(event.streams[0],config.constrains)
                event.streams[0].getTracks().forEach(t=>{
                    console.log(t)
                })
                this.attachMediaStream(null,event.streams[0],{returnElm: true, muted: false}, (new_element, new_constrains)=>{
                    this.peer_media_elements[socket_id] = new_element
                })
                peer_connection.onnegotiationneeded = (event) =>{
                    
                    peer_connection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true})
                    .then((local_description)=>{
                        console.log(local_description.sdp)
                        return peer_connection.setLocalDescription(local_description)
                    })
                    .then(()=>{
                        this.signaling_socket.emit('relaySessionDescription',
                        { 'socket_id': socket_id, 'session_description': peer_connection.localDescription});
                    })
                    .catch((e)=>{
                        console.log(e.message)
                    })

                }
                this.onBroadcasterCallback(this.peer_media_elements[socket_id], socket_id, config.constrains)
            }

            if (this instanceof Broadcaster) {
                this.senders[socket_id] = {}
                this.local_media_stream.getTracks().forEach((track) =>{
                    this.senders[socket_id][track.kind] = peer_connection.addTrack(track, this.local_media_stream)
                });
            }
            if (config.should_create_offer) {
                this.negotiate(peer_connection, socket_id)
            }
        })
    }
    regiceCandidate() {
        this.regHandler('iceCandidate', (config) => {
            this.peers[config.socket_id].addIceCandidate(new RTCIceCandidate(config.ice_candidate));
        })
    }
    setProperties(sdp, properties){
        if(properties.audio_bitrate){
            sdp = sdp.replace(/a=mid:audio\r\n/g, 'a=mid:audio\r\nb=AS:' + properties.audio_bitrate + '\r\n');
        }
        if(properties.video_bitrate){
            sdp = sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:' + properties.video_bitrate + '\r\n');
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
                        peer.createAnswer()
                            .then((local_description)=>{
                                if(config){
                                    if(config.properties){
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
        this.signaling_socket.on('new_constrains', (options)=>{
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
                delete this.senders[config.socket_id]
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
