import * as UTILS from "./Uitls.js";

var ICE_SERVERS = [
    {url:"stun:stun.l.google.com:19302"}
];


export default class PublicConnection{
    constructor(SIGNALING_SERVER,CHANNEL,CONSTRAINTS){
        this.signaling_server = SIGNALING_SERVER;
        this.constrains = {};
        CONSTRAINTS ? (
                      this.constrains.use_video = CONSTRAINTS.use_video,
                      this.constrains.use_audio = CONSTRAINTS.use_audio)
                    : this.findAvailableDevices = true;
        this.peers = {};
        this.peer_media_elements = {}                
        this.channel = CHANNEL;
        this.local_media_stream = null
        this.signaling_socket = io()
        this.createConnectDisconnectHandlers()
        this.createSessionDescriptor()
        this.createHandlers()
    }
    
    createConnectDisconnectHandlers(){
       
        
        this.signaling_socket.on('connect', ()=> {
            UTILS.findDevices((found_fonstrains)=> {
                this.constrains.use_audio = found_fonstrains.audio
                this.constrains.use_video = found_fonstrains.video

                if (this.local_media_stream != null) {  /* ie, if we've already been initialized */
                    return; 
                }
                UTILS.setup_local_media(this.constrains, $('body'),
                (stream) => {
                    this.local_media_stream = stream
                    this.join_chat_channel();
                },
                () => {
                    console.log("Couldn't set up media!")
                })
            })
        });
        this.signaling_socket.on('disconnect',()=>{
            for (let peer_id in this.peer_media_elements) {
                this.peer_media_elements[peer_id].remove();
            }
            for (let peer_id in this.peers) {
                this.peers[peer_id].close();
            }
            this.peers = {};
            this.peer_media_elements = {};
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
        this.signaling_socket.on('sessionDescription', (config) => {
            
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
    createHandlers(){
        /**
         * The offerer will send a number of ICE Candidate blobs to the answerer so they 
         * can begin trying to find the best path to one another on the net.
         */
        this.signaling_socket.on('iceCandidate', (config) => {
            this.peers[config.peer_id].addIceCandidate(new RTCIceCandidate(config.ice_candidate));
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
        this.signaling_socket.on('removePeer',(config)=>{
            var peer_id = config.peer_id;
            console.log(peer_id)
            if (peer_id in this.peer_media_elements) {
                this.peer_media_elements[peer_id].remove();
            }
            if (peer_id in this.peers) {
                this.peers[peer_id].close();
            }
            delete this.peers[peer_id];
            delete this.peer_media_elements[config.peer_id];
        });
        /** 
        * When we join a group, our signaling server will send out 'addPeer' events to each pair
        * of users in the group (creating a fully-connected graph of users, ie if there are 6 people
        * in the channel you will connect directly to the other 5, so there will be a total of 15 
        * connections in the network). 
        */
        let self = this
        this.signaling_socket.on('addPeer', (config)=>{
           
            var peer_id = config.peer_id;
           
            if (peer_id in this.peers) {
                return;
            }
            var peer_connection = new RTCPeerConnection(
                {"iceServers": ICE_SERVERS},
                {"optional": [{"DtlsSrtpKeyAgreement": true}]} 
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
            peer_connection.onaddstream = (event) => {
                this.peer_media_elements[peer_id] = UTILS.setup_media(config.constrains,event.stream,$('body'),{muted:false,returnElm:true})
                
            }

            /* Add our local stream */
           
            peer_connection.addStream(this.local_media_stream);

            /* Only one side of the peer connection should create the
            * offer, the signaling server picks one to be the offerer. 
            * The other user will get a 'sessionDescription' event and will
            * create an offer, then send back an answer 'sessionDescription' to us
            */
            if (config.should_create_offer) {
               
                peer_connection.createOffer(
                    (local_description) => {   console.log("Local offer description is: ", local_description);
                        peer_connection.setLocalDescription(local_description,
                            () => { 
                                this.signaling_socket.emit('relaySessionDescription', 
                                    {'peer_id': peer_id, 'session_description': local_description});
                                console.log("Offer setLocalDescription succeeded"); 
                            },
                            () => { Alert("Offer setLocalDescription failed!"); }
                        );
                    },
                    (error) =>{
                        console.log("Error sending offer: ", error);
                    });
            }
        });
    }
    join_chat_channel(channel) { 
        let constrains = this.constrains
        this.signaling_socket.emit('join', {"constrains": constrains});
    }
    part_chat_channel(channel) {
        this.signaling_socket.emit('part', channel);
    }
}