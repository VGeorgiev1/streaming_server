var ICE_SERVERS = [
    {url:"stun:stun.l.google.com:19302"}
];

export default class Connection {
    constructor(SIGNALING_SERVER, CHANNEL, type) {
        this.signaling_server = SIGNALING_SERVER;
        console.log(SIGNALING_SERVER)
        this.signaling_socket = io()
        this.channel = CHANNEL
        this.peers = {};
        this.peer_media_elements = {};
        this.type = type
    }
    regAddPeer(){
        
        this.regHandler('addPeer', (config) => {
            console.log(config)
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
                this.peer_media_elements[peer_id] = this.setup_media(config.constrains, event.streams[0], $('body'), { muted: false, returnElm: true });
            }
            if(this.type !='viewer'){
                this.local_media_stream.getTracks().forEach(track => peer_connection.addTrack(track, this.local_media_stream));
            }
            if (config.should_create_offer) {
                peer_connection.createOffer(
                    (local_description) => {
                        peer_connection.setLocalDescription(local_description,
                            () => {
                                this.signaling_socket.emit('relaySessionDescription',
                                    { 'peer_id': peer_id, 'session_description': local_description });
                            },
                            () => { Alert("Offer setLocalDescription failed!"); }
                        );
                    },
                    (error) => {
                        console.log("Error sending offer: ", error);
                    },{offerToReceiveAudio : true});
            }
        })
    }
    regiceCandidate(){
        this.regHandler('iceCandidate', (config) => {
            this.peers[config.peer_id].addIceCandidate(new RTCIceCandidate(config.ice_candidate));
        })
    }
    regSessionDescriptor(){
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
                                    peer.setLocalDescription(local_description,
                                        ()=>{ 
                                            this.signaling_socket.emit('relaySessionDescription', 
                                                {'peer_id': peer_id, 'session_description': local_description});
                                        },
                                        () =>{ Alert("Answer setLocalDescription failed!"); }
                                    );
                                },
                                (error) => {
                                    console.log("Error creating answer: ", error);
                                    console.log(peer);
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
        console.log('asd')
        this.regAddPeer();
        this.regiceCandidate();
        this.regSessionDescriptor();
        this.signaling_socket.on('connect', callback);
    }

    regDiscconectHandler(callback) {
        this.signaling_socket.on('disconnect', callback);
    }
    regHandler(event, callback) {
        this.signaling_socket.on(event, callback);
    }
    part_channel() {
        this.signaling_socket.emit('part', 'let me out');
    }
    join_channel(constrains) {
        this.signaling_socket.emit('join', { "constrains": constrains });
    }
    async findDevices(callback) {
        navigator.mediaDevices.enumerateDevices().then(devices => {
            let use_audio, use_video = false
            for (let i = 0; i < devices.length; i++) {
                if (devices[i].kind === 'audioinput') use_audio = true;
                if (devices[i].kind === 'videoinput') use_video = true;
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
        element.srcObject = stream;
    }
    setup_media(constrains, stream, elem, options, callback) {

        var media = constrains.video ? $("<video>") : $("<audio>");
        media.attr("autoplay", "autoplay");
        media.prop("muted", options.muted); /* always mute ourselves by default */
        media.attr("controls", "");
        elem.append(media);
        this.attachMediaStream(media[0], stream);
        if (options.returnElm) return media
    }
    setup_local_media(constrains, elem, callback, errorback) {
        console.log(constrains)
        navigator.mediaDevices.getUserMedia(constrains).then(
            (stream) => {
                if(this.type == 'broadcaster'){
                  this.setup_media(constrains, stream, elem, { muted: true })
                }
                callback(stream)
            }).catch(
            () => {
                alert("You chose not to provide access to the camera/microphone, demo will not work.");
                if (errorback) errorback();
            })

    }
}
