import Connection from "./Connection.js"
export default class Broadcaster extends Connection{
    constructor(SIGNALING_SERVER,socket,CONSTRAINTS,id){
        super(SIGNALING_SERVER,socket, 'broadcaster',id)
        this.constrains = {};
        this.audioBitrate = 50
        this.videoBitrate = 256
        this.media_element = null
        this.tracks = {}
        this.senders = {}
        this.audioDevices = []
        this.videoDevices = []
        if(CONSTRAINTS != 'screen-share'){
            CONSTRAINTS ? (
                      this.constrains.video = CONSTRAINTS.video,
                      this.constrains.audio = CONSTRAINTS.audio)
                      : this.constrains = null
            this.local_media_stream = null
        }else{
            this.is_screen_share = true
            this.constrains.video = true
            this.constrains.audio = false
            this.local_media_stream = document.getElementById('mine').srcObject
        }
    
    }
    
    getAudioDevices(){
        while(this.audioDevices.length == 0)
            ;
        return this.audioDevices;
    }
    getVideoDevices(){
        return this.videoDevices;
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
                    local_description.sdp = this.setProperties(local_description.sdp,properties)
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
    getRoomRules(callback){
        this.signaling_socket.emit('getRules', this.channel)
        this.regHandler('rules', callback)
    }
    setOffersAndConstrains(constrains){
        this.offers = {}
        this.offers.audio = constrains.audio
        this.offers.video = constrains.video
        this.constrains = constrains
    }
    changeTracks(constrains){
        this.local_media_stream.getTracks().forEach(track=> track.stop())
        navigator.mediaDevices.getUserMedia(constrains).then((stream)=>{
            this.local_media_stream = stream
            for(let peer in this.peers){
                this.local_media_stream.getTracks().forEach(track =>{
                    this.senders[peer][track.kind].replaceTrack(track)
                })
            }
            this.attachMediaStream(this.media_element, stream)
        }).catch(e=>{
            console.log(e.message)
        })
    }
    changeVideoTrack(id, callback){
        this.changeTracks({audio: this.constrains.audio, video : {deviceId: { exact: id}}});
    }
    changeAudioTrack(id, callback){
        this.changeTracks({audio: {deviceId: { exact: id}, video: this.constrains.video}})
    }
    createConnectDisconnectHandlers(callback){
        if(!this.is_screen_share){
            this.regConnectHandler(()=> {
                if (this.local_media_stream != null) {  
                    return; 
                }
                this.getRoomRules((rules)=>{
                    this.findConstrains(rules,(constrains)=>{
                        this.setOffersAndConstrains(constrains)
                        this.setup_local_media(constrains, document.getElementsByTagName('body')[0],
                        (stream) => {
                            this.local_media_stream = stream
                            this.join_channel(this.constrains);
                            if(callback)
                                callback(stream)
                        },
                        () => {
                            console.log("Couldn't set up media: ")
                        })
                    })
                })
            })
        }else{
            this.regConnectHandler(()=>{
               
                this.setOffersAndConstrains(this.constrains)
                this.join_channel(this.constrains)
            })
        }
    }
}