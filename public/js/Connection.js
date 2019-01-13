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
    }
    subscribeTo(CHANNEL, callback){
        this.channel = CHANNEL
        this.createConnectDisconnectHandlers(callback)
    }
    regAddPeer() {
        this.regHandler('addPeer', (config) => {
            var peer_id = config.peer_id;
            if (peer_id in this.peers) {
                return;
            }
            var peer_connection = new RTCPeerConnection(
                { "iceServers": ICE_SERVERS },
                { "optional": [{ "DtlsSrtpKeyAgreement": true }] }
            );

            this.peers[peer_id] = peer_connection;
            peer_connection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.signaling_socket.emit('relayICECandidate', {
                        'peer_id': peer_id,
                        'ice_candidate': {
                            'sdpMLineIndex': event.candidate.sdpMLineIndex,
                            'candidate': event.candidate.candidate
                        }
                    });
                }
            }
            peer_connection.ontrack = (event) => {
                
                if (this.peer_media_elements[peer_id]) {
                    this.attachMediaStream(this.peer_media_elements[peer_id], event.streams[0])
                    return;
                }
                this.peer_media_elements[peer_id] = this.setup_media(config.constrains, event.streams[0], { muted: false, returnElm: true });
                document.getElementsByTagName('body')[0].append(this.peer_media_elements[peer_id])
            }

            if (this.type != 'viewer') {
                this.senders[peer_id] = {}
                this.local_media_stream.getTracks().forEach((track) =>{
                    this.senders[peer_id][track.kind] = peer_connection.addTrack(track, this.local_media_stream)
                });
            }
            
            if (config.should_create_offer) {
                peer_connection.createOffer(
                    (local_description) => {
                       
                        peer_connection.setLocalDescription(local_description,
                            () => {
                                this.signaling_socket.emit('relaySessionDescription',
                                    { 'peer_id': peer_id, 'session_description': local_description});
                            },
                            () => { Alert("Offer setLocalDescription failed!"); }
                        );
                    },
                    (error) => {
                        console.log("Error sending offer: ", error);
                    }, { offerToReceiveAudio: true, offerToReceiveVideo: true });
            }
        })
    }
    regiceCandidate() {
        this.regHandler('iceCandidate', (config) => {
            this.peers[config.peer_id].addIceCandidate(new RTCIceCandidate(config.ice_candidate));
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
    removeTrack(){
        
    }
    regSessionDescriptor() {
        this.regHandler('sessionDescription', (config) => {
            var peer_id = config.peer_id;
            var peer = this.peers[peer_id];
            var remote_description = config.session_description;
            var desc = new RTCSessionDescription(remote_description);
            var stuff = peer.setRemoteDescription(desc,
                () => {
                    if (remote_description.type == "offer") {
                        peer.createAnswer(
                            (local_description) => {
                                if(config){
                                    if(config.properties){
                                        local_description.sdp = this.setProperties(local_description.sdp, config.properties)
                                    }
                                    peer.setLocalDescription(local_description,
                                        () => {
                                            this.signaling_socket.emit('relaySessionDescription',
                                                { 'peer_id': peer_id, 'session_description': local_description });
                                        },
                                        (e) => { console.log(e.message) }
                                    );
                                }
                            },
                            (error) => {
                                console.log("Error creating answer: ", error);
                            });
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
    regRemovePeer(callback) {
        this.regHandler('removePeer', () => {
            for (let peer_id in this.peer_media_elements) {
                this.peer_media_elements[peer_id].remove();
            }
            for (let peer_id in this.peers) {
                this.peers[peer_id].close();
            }
            this.peers = {};
            this.peer_media_elements = {};
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
        console.log(element)
        element.srcObject = stream;
    }
    setup_media(constrains, stream, options, callback) {
        let container = document.createElement('div')
        let media = constrains.video ? document.createElement('video') : document.createElement('audio');
        media.autoplay = "autoplay"
        media.muted = options.muted 
        media.controls = "controls";
        this.attachMediaStream(media, stream);
        container.append(media)
        this.media_element = media
        if (options.returnElm) return container
    }
    setup_local_media(constrains, elem, callback, errorback) {
        console.log(constrains)
        navigator.mediaDevices.getUserMedia(constrains)
        .then(
            (stream) => {
                if (this.type == 'broadcaster') {
                    let mEl = this.setup_media(constrains, stream, { muted: true, returnElm: true })
                    elem.append(mEl)
                }
                if(callback)
                    callback(stream)
        }).catch((e) => {
                console.log(e.message)
                alert("You chose not to provide access to the camera/microphone, demo will not work.");
                if (errorback) errorback();
        })
    }
}
