var ICE_SERVERS = [
    { url: "stun:stun.l.google.com:19302" }
];

export default class Connection {
    constructor(SIGNALING_SERVER, CHANNEL,socket, type, id) {
        this.signaling_server = SIGNALING_SERVER;
        this.signaling_socket = socket
        this.id = id
        this.channel = CHANNEL
        this.peers = {};
        this.peer_media_elements = {};
        this.type = type
    }
    regAddPeer() {

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
                if (this.peer_media_elements[peer_id]) {
                    this.attachMediaStream(this.peer_media_elements[peer_id], event.streams[0])
                    return;
                }
                this.peer_media_elements[peer_id] = this.setup_media(config.constrains, event.streams[0], { muted: false, returnElm: true });
                $('body').append(this.peer_media_elements[peer_id])
            }
            if (this.type != 'viewer') {
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
                    }, { offerToReceiveAudio: true, offerToReceiveVide: true });
            }
        })
    }
    regiceCandidate() {
        this.regHandler('iceCandidate', (config) => {
            this.peers[config.peer_id].addIceCandidate(new RTCIceCandidate(config.ice_candidate));
        })
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
                                peer.setLocalDescription(local_description,
                                    () => {
                                        this.signaling_socket.emit('relaySessionDescription',
                                            { 'peer_id': peer_id, 'session_description': local_description });
                                    },
                                    () => { Alert("Answer setLocalDescription failed!"); }
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
    regDiscconectHandler() {

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
    setup_media(constrains, stream, options, callback) {
        let container = $("<div>")
        let media = constrains.video ? $("<video>") : $("<audio>");
        media.attr("autoplay", "autoplay");
        media.prop("muted", options.muted); /* always mute ourselves by default */
        media.attr("controls", "");
        this.attachMediaStream(media[0], stream);
        container.append(media)
        if (options.returnElm) return container
    }
    mute_audio(){
        let tracks = this.local_media_stream.getAudioTracks()
        if(tracks[0].enabled == true){
            tracks[0].enabled = false;
            return;
        }
        tracks[0].enabled = true;
    }
    setup_local_media(constrains, elem, callback, errorback) {
        navigator.mediaDevices.getUserMedia(constrains)
        .then(
            (stream) => {
                if (this.type == 'broadcaster') {
                    let mEl = this.setup_media(constrains, stream, { muted: true, returnElm: true })
                    mEl.append($('<button>').html('Mute').click(this.mute_audio.bind(this)))
                    elem.append(mEl)
                }
                if(callback)
                    callback(stream)
        }).catch(() => {
                alert("You chose not to provide access to the camera/microphone, demo will not work.");
                if (errorback) errorback();
        })
    }
}
