var ICE_SERVERS = [
    { url: "stun:stun.l.google.com:19302" }
];

export default class Connection {
    constructor(SIGNALING_SERVER,socket, type, id) {
        this.signaling_server = SIGNALING_SERVER;
        this.signaling_socket = socket
        this.id = id
        this.peers = {};
        this.peer_media_elements = {};
        this.type = type
        this.onBroadcasterCallback = null
        this.onPeerDiscconectCallback = null
    }
    subscribeTo(CHANNEL, callback){
        this.channel = CHANNEL
        this.createConnectDisconnectHandlers(callback)
    }
    onBroadcaster(callback){
        this.onBroadcasterCallback = callback
    }
    onPeerDiscconect(callback){
        this.onPeerDiscconectCallback = callback
    }
    getConstrains(){
        return this.constrains
    }
    getMediaElement(){
        return this.media_element
    }
    regAddPeer() {
        this.regHandler('addPeer', (config) => {
            console.log(config)
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
                if (this.peer_media_elements[socket_id]) {
                    this.attachMediaStream(this.peer_media_elements[socket_id], event.streams[0])
                    return;
                }
                this.peer_media_elements[socket_id] = this.setup_media(config.constrains, event.streams[0], { muted: false, returnElm: true });
                console.log(config.constrains)
                this.onBroadcasterCallback(this.peer_media_elements[socket_id], socket_id, config.constrains)
            }

            if (this.type != 'viewer') {
                this.senders[socket_id] = {}
                this.local_media_stream.getTracks().forEach((track) =>{
                    this.senders[socket_id][track.kind] = peer_connection.addTrack(track, this.local_media_stream)
                });
            }
            if (config.should_create_offer) {
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
            console.log(config)
            var remote_description = config.session_description;
            var desc = new RTCSessionDescription(remote_description);
            var stuff = peer.setRemoteDescription(desc,
                () => {
                    if (remote_description.type == "offer") {
                        peer.createAnswer()
                            .then((local_description)=>{
                                if(config){
                                    if(config.properties){
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
    regConnectHandler(callback) {
        this.regAddPeer();
        this.regiceCandidate();
        this.regSessionDescriptor();
        this.regRemovePeer()
        this.regHandler('connect', () => {
            if (callback)
                callback()
        })
    }
    regRemovePeer() {
        this.regHandler('removePeer', (config) => {
            if(config.socket_id in this.peers){
                this.peers[config.socket_id].close();
            }
            if(this.onPeerDiscconectCallback)
                this.onPeerDiscconectCallback(config.socket_id)
        })
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
            for (let i = 0; i < devices.length; i++) {
                if (devices[i].kind === 'audioinput') use_audio = true, this.audioDevices.push(devices[i]);
                if (devices[i].kind === 'videoinput') use_video = true, this.videoDevices.push(devices[i]);
            }
            if(!rules.audio && rules.audio != null){
                use_audio = false
            }
            if(!rules.video && rules.video != null){
                use_audio = false
            }
            
            callback({ 'audio': use_audio, 'video': use_video })
        })
    }
    findWebRTC() {
        return (navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia)
    }
    attachMediaStream(element, stream) {
        stream.getAudioTracks().forEach(t=>{
            console.log(t)
        })
        element.srcObject = stream;
    }
    setup_media(constrains, stream, options, callback) {
        let media = constrains.video ? document.createElement('video') : document.createElement('audio');
        media.autoplay = "autoplay"
        media.muted = options.muted 
        media.controls = "controls";
        this.attachMediaStream(media, stream);
        if (options.returnElm) return media
    }
    setup_local_media(constrains, callback, errorback) {
        navigator.mediaDevices.getUserMedia(constrains)
        .then(
            (stream) => {
                let mEl = null;
                if (this.type == 'broadcaster') {
                    mEl = this.setup_media(constrains, stream, { muted: true, returnElm: true })
                    this.media_element = mEl
                }
                if(callback)
                    callback(mEl,stream)
        }).catch((e) => {
                console.log(e.message)
                if (errorback) errorback();
        })
    }
}
