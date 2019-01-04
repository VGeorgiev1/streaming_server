import Connection from "./Connection.js"
export default class Broadcaster extends Connection{ 
    constructor(SIGNALING_SERVER,CHANNEL,socket,CONSTRAINTS,id){
        super(SIGNALING_SERVER,CHANNEL,socket, 'broadcaster',id)
        this.constrains = {};
        if(CONSTRAINTS != 'screen-share'){
            CONSTRAINTS ? (
                      this.constrains.video = CONSTRAINTS.video,
                      this.constrains.audio = CONSTRAINTS.audio)
                    : this.findDevices((constrains)=>{this.constrains = constrains})
            this.local_media_stream = null
        }else{
            this.is_screen_share = true
            this.constrains.video = true
            this.constrains.audio = false
            this.local_media_stream = document.getElementById('mine').srcObject
        }
        this.offers = {}
        this.offers.audio = this.constrains.audio
        this.offers.video = this.constrains.video
        this.audioBitrate = 50
        this.videoBitrate = 256    
        this.createConnectDisconnectHandlers()
    }
    setAudioBitrates(audioBitrate) {
        if(this.constrains.audio && audioBitrate >=8 && audioBitrate<=500){
            this.audioBitrate = audioBitrate
            this.changeSdpSettings({audio_bitrate: this.audioBitrate})
        }
    }
    setVideoBitrates(videoBitrate){
        if(this.constrains.video && videoBitrate >=8 && videoBitrate<=500){
            this.videoBitrate = videoBitrate
            this.changeSdpSettings({video_bitrate: this.videoBitrate})
        }
    }
    mute_audio(){
        let tracks = this.local_media_stream.getAudioTracks()
        if(tracks[0].enabled == true){
            tracks[0].enabled = false;
            return;
        }
        tracks[0].enabled = true;
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
                        (e) => { console.log(e.message) }
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
                this.setup_local_media(this.constrains, document.getElementsByTagName('body')[0],
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