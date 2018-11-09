/** CONFIG **/
var SIGNALING_SERVER = "http://localhost";
var USE_AUDIO = false;
var USE_VIDEO = false;
var DEFAULT_CHANNEL = 'some-global-channel-name';
var MUTE_AUDIO_BY_DEFAULT = false;

/** You should probably use a different stun server doing commercial stuff **/
/** Also see: https://gist.github.com/zziuni/3741933 **/
var ICE_SERVERS = [
    {url:"stun:stun.l.google.com:19302"}
];

var peers = {};                /* keep track of our peer connections, indexed by peer_id (aka socket.io id) */
var peer_media_elements = {};  /* keep track of our <video>/<audio> tags, indexed by peer_id */
var signaling_socket = null;

class Connection{
    constructor(SIGNALING_SERVER,CHANNEL,CONSTRAINTS){
        this.signaling_server = SIGNALING_SERVER;
        this.constrains = {};
        CONSTRAINTS ? (
                      this.constrains.use_video = CONSTRAINTS.use_video,
                      this.constrains.use_audio = CONSTRAINTS.use_audio)
                    : this.findAvailableDevices = true;
       
        this.channel = CHANNEL;
        this.signaling_socket = io();
        this.local_media_stream = null
        
        this.createConnectDisconnectHandlers()
        this.createSessionDescriptor()
        this.createHandlers()
       
        
        console.log('in sconstructor')
    }
    async findDevices(callback){
        navigator.mediaDevices.enumerateDevices().then(devices =>{
            for(let i=0;i<devices.length;i++){
                if(devices[i].kind === 'audioinput') this.constrains.use_audio = true;
                if(devices[i].kind === 'videoinput') this.constrains.use_video = true;
            }
            callback()
        })
    }
    findWebRTC(){
        return (navigator.getUserMedia ||
               navigator.webkitGetUserMedia ||
               navigator.mozGetUserMedia ||
               navigator.msGetUserMedia)
    }
    attachMediaStream(element, stream){
        element.srcObject = stream;
    }
    setup_local_media(callback, errorback) {
        if (this.local_media_stream != null) {  /* ie, if we've already been initialized */
            if (callback) callback();
            return; 
        }
        navigator.getUserMedia = this.findWebRTC()

        
        let self = this
        navigator.getUserMedia({"audio":this.constrains.use_audio, "video":this.constrains.use_video}, 
            (stream)=>{
                
                self.local_media_stream = stream;
                console.log(self.local_media_stream)
                console.log("succes")
                var local_media = self.constrains.use_video ? $("<video>") : $("<audio>");
                local_media.attr("autoplay", "autoplay");
                local_media.prop("muted", false); /* always mute ourselves by default */
                local_media.attr("controls", "");
                $('body').append(local_media);
                self.attachMediaStream(local_media[0], stream);
                if (callback) callback();
            },
            ()=>{
                alert("You chose not to provide access to the camera/microphone, demo will not work.");
                if (errorback) errorback();
            }
        )
          
    }
    createConnectDisconnectHandlers(){
        let self = this
        this.signaling_socket.on('connect', function() {
            self.findDevices(()=> {
                    self.setup_local_media(function() {
                        self.join_chat_channel(DEFAULT_CHANNEL);
                })
            })
        });
        this.signaling_socket.on('disconnect', function() {
            for (let peer_id in peer_media_elements) {
                peer_media_elements[peer_id].remove();
            }
            for (let peer_id in peers) {
                peers[peer_id].close();
            }
            peers = {};
            peer_media_elements = {};
        });
    }
    createSessionDescriptor(){
        /** 
         * Peers exchange session descriptions which contains information
         * about their audio / video settings and that sort of stuff. First
         * the 'offerer' sends a description to the 'answerer' (with type
         * "offer"), then the answerer sends one back (with type "answer").  
         */
        let self = this
        this.signaling_socket.on('sessionDescription', function(config) {
            console.log('Remote description received: ', config);
            var peer_id = config.peer_id;
            var peer = peers[peer_id];
            var remote_description = config.session_description;
            console.log(config.session_description);

            var desc = new RTCSessionDescription(remote_description);
            var stuff = peer.setRemoteDescription(desc, 
                function() {
                    console.log("setRemoteDescription succeeded");
                    if (remote_description.type == "offer") {
                        console.log("Creating answer");
                        peer.createAnswer(
                            function(local_description) {
                                console.log("Answer description is: ", local_description);
                                peer.setLocalDescription(local_description,
                                    function() { 
                                        self.signaling_socket.emit('relaySessionDescription', 
                                            {'peer_id': peer_id, 'session_description': local_description});
                                        console.log("Answer setLocalDescription succeeded");
                                    },
                                    function() { Alert("Answer setLocalDescription failed!"); }
                                );
                            },
                            function(error) {
                                console.log("Error creating answer: ", error);
                                console.log(peer);
                            });
                    }
                },
                function(error) {
                    console.log("setRemoteDescription error: ", error);
                }
            );
            console.log("Description Object: ", desc);

        });
    }
    createHandlers(){
        /**
         * The offerer will send a number of ICE Candidate blobs to the answerer so they 
         * can begin trying to find the best path to one another on the net.
         */
        this.signaling_socket.on('iceCandidate', function(config) {
            var peer = peers[config.peer_id];
            var ice_candidate = config.ice_candidate;
            
            peer.addIceCandidate(new RTCIceCandidate(ice_candidate));
        });


        /**
         * When a user leaves a channel (or is disconnected from the
         * signaling server) everyone will recieve a 'removePeer' message
         * telling them to trash the media channels they have open for those
         * that peer. If it was this client that left a channel, they'll also
         * receive the removePeers. If this client was disconnected, they
         * wont receive removePeers, but rather the
         * signaling_socket.on('disconnect') code will kick in and tear down
         * all the peer sessions.
         */
        this.signaling_socket.on('removePeer', function(config) {
            console.log('Signaling server said to remove peer:', config);
            var peer_id = config.peer_id;
            for (peer_id in peer_media_elements) {
                peer_media_elements[peer_id].remove();
            }
            for (peer_id in peers) {
                peers[peer_id].close();
            }

            delete peers[peer_id];
            delete peer_media_elements[config.peer_id];
        });
        /** 
        * When we join a group, our signaling server will send out 'addPeer' events to each pair
        * of users in the group (creating a fully-connected graph of users, ie if there are 6 people
        * in the channel you will connect directly to the other 5, so there will be a total of 15 
        * connections in the network). 
        */
        let self = this
        this.signaling_socket.on('addPeer', function(config) {
            console.log('Signaling server said to add peer:', config);
            var peer_id = config.peer_id;
            if (peer_id in peers) {
                /* This could happen if the user joins multiple channels where the other peer is also in. */
                console.log("Already connected to peer ", peer_id);
                return;
            }
            var peer_connection = new RTCPeerConnection(
                {"iceServers": ICE_SERVERS},
                {"optional": [{"DtlsSrtpKeyAgreement": true}]} /* this will no longer be needed by chrome
                                                                * eventually (supposedly), but is necessary 
                                                                * for now to get firefox to talk to chrome */
            );
            peers[peer_id] = peer_connection;

            peer_connection.onicecandidate = function(event) {
                if (event.candidate) {
                    self.signaling_socket.emit('relayICECandidate', {
                        'peer_id': peer_id, 
                        'ice_candidate': {
                            'sdpMLineIndex': event.candidate.sdpMLineIndex,
                            'candidate': event.candidate.candidate
                        }
                    });
                }
            }
            peer_connection.onaddstream = function(event) {
                console.log(config)
                var remote_media = config.constrains.use_video ? $("<video>") : $("<audio>");
                console.log(remote_media)
                remote_media.attr("autoplay", "autoplay");
                if (MUTE_AUDIO_BY_DEFAULT) {
                    remote_media.attr("muted", "true");
                }
                remote_media.attr("controls", "");
                peer_media_elements[peer_id] = remote_media;
                $('body').append(remote_media);
                
                self.attachMediaStream(remote_media[0], event.stream);
            }

            /* Add our local stream */
           
            peer_connection.addStream(self.local_media_stream);

            /* Only one side of the peer connection should create the
            * offer, the signaling server picks one to be the offerer. 
            * The other user will get a 'sessionDescription' event and will
            * create an offer, then send back an answer 'sessionDescription' to us
            */
            if (config.should_create_offer) {
                console.log("Creating RTC offer to ", peer_id);
                peer_connection.createOffer(
                    function (local_description) { 
                        console.log("Local offer description is: ", local_description);
                        peer_connection.setLocalDescription(local_description,
                            function() { 
                                self.signaling_socket.emit('relaySessionDescription', 
                                    {'peer_id': peer_id, 'session_description': local_description});
                                console.log("Offer setLocalDescription succeeded"); 
                            },
                            function() { Alert("Offer setLocalDescription failed!"); }
                        );
                    },
                    function (error) {
                        console.log("Error sending offer: ", error);
                    });
            }
        });
    }
    join_chat_channel(channel) { 
        self = this
        this.signaling_socket.emit('join', {"constrains": self.constrains});
    }
    part_chat_channel(channel) {
        this.signaling_socket.emit('part', channel);
    }
}
console.log("asd")

var connection = new Connection(SIGNALING_SERVER,null, null)

