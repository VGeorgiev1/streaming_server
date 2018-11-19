import Connection from "./Connection.js"
var ICE_SERVERS = [
    {url:"stun:stun.l.google.com:19302"}
];
export default class Broadcaster extends Connection{ 
    constructor(SIGNALING_SERVER,CHANNEL,CONSTRAINTS,RULE){
        super(SIGNALING_SERVER)
        this.constrains = {};
        if(CONSTRAINTS != 'screen-share'){
            CONSTRAINTS ? (
                      this.constrains.video = CONSTRAINTS.video,
                      this.constrains.audio = CONSTRAINTS.audio)
                    : this.findDevices((constrains)=>{this.constrains = constrains})
            this.local_media_stream = null
        }else{
            this.is_screen_share = true
            this.local_media_stream = document.getElementById('mine').srcObject
        }
        this.createConnectDisconnectHandlers()
        this.createSessionDescriptor()
        this.createHandlers()
    }
    
    createConnectDisconnectHandlers(){
        if(!this.is_screen_share){
            this.regConnectHandler(()=> {
                if (this.local_media_stream != null) {  /* ie, if we've already been initialized */
                    return; 
                }
                this.setup_local_media(this.constrains, $('body'),
                (stream) => {
                    this.local_media_stream = stream
                    this.join_channel(this.constrains);
                },
                () => {
                    console.log("Couldn't set up media!")
                })
            })
        }else{
            this.regConnectHandler(this.join_channel)
        }

        this.regDiscconectHandler(()=>{
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
    createSessionDescriptor(){
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
        this.regHandler('iceCandidate', (config) => {
            this.peers[config.peer_id].addIceCandidate(new RTCIceCandidate(config.ice_candidate));
        })
        this.regHandler('removePeer', (config)=>{
            var peer_id = config.peer_id;
            if (peer_id in this.peer_media_elements) {
                this.peer_media_elements[peer_id].remove();
            }
            if (peer_id in this.peers) {
                this.peers[peer_id].close();
            }
            delete this.peers[peer_id];
            delete this.peer_media_elements[config.peer_id];
        })
        this.regHandler('addPeer', (config)=>{
            console.log(config)
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
                this.peer_media_elements[peer_id] = this.setup_media(config.constrains,event.stream,$('body'),{muted:false,returnElm:true})
            }
            peer_connection.addStream(this.local_media_stream);
            if (config.should_create_offer) {
                peer_connection.createOffer(
                    (local_description) => {  
                        peer_connection.setLocalDescription(local_description,
                            () => { 
                                this.signaling_socket.emit('relaySessionDescription', 
                                    {'peer_id': peer_id, 'session_description': local_description});
                            },
                            () => { Alert("Offer setLocalDescription failed!"); }
                        );
                    },
                    (error) =>{
                        console.log("Error sending offer: ", error);
                    });
            }
        })
    }
}