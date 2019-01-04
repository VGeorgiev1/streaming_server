import Connection from "./Connection.js"
export default class Broadcaster extends Connection{ 
    constructor(SIGNALING_SERVER,CHANNEL,socket,CONSTRAINTS,id){
        super(SIGNALING_SERVER,CHANNEL,socket, 'broadcaster',id)
        this.constrains = {};
        if(CONSTRAINTS != 'screen-share'){
            CONSTRAINTS ? (
                      this.offers.video = this.constrains.video = CONSTRAINTS.video,
                      this.offers.audio = this.constrains.audio = CONSTRAINTS.audio)
                    : this.findDevices((constrains)=>{this.constrains = constrains})
            this.local_media_stream = null
        }else{
            this.is_screen_share = true
            this.constrains.video = true
            this.constrains.audio = false
            this.local_media_stream = document.getElementById('mine').srcObject
        }
        this.audioBitrate = 50
        this.videoBitrate = 256    
        this.createConnectDisconnectHandlers()
    }
    setAudioBitrates(audioBitrate) {
        if(this.constrains.audio){
            this.audioBitrate = audioBitrate
            changeSdpSettings({audio_bitrate: this.audioBitrate})
        }
    }
    setVideoBitrates(videoBitrate){
        if(this.constrains.video){
            this.videoBitrate = videoBitrate
            changeSdpSettings({video_bitrate: this.videoBitrate})
        }
    }
    changeSdpSettings(properties){
        for(let peerId in this.peers){
            let peer_connection = this.peers[peerId]
            peer_connection.createOffer(
                (local_description) => {
                    peer_connection.setLocalDescription(local_description,
                        () => { 
                            this.signaling_socket.emit('relaySessionDescription',
                                { 'peer_id': peerId, 'session_description': local_description , "properties": properties});
                        },
                        () => { Alert("Offer setLocalDescription failed!"); }
                    );
                }, 
                (error) => {
                    console.log("Error sending offer: ", error);
                }, { offerToReceiveAudio: this.offers.audio, offerToReceiveVideo: this.offers.video }
            );
        }
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
            this.regConnectHandler(()=>{console.log('im here')})
        }
    }
}