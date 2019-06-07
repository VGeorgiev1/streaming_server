import Broadcaster from "./Broadcaster.js"

export default class SurveillanceBroadcast extends Broadcaster{
    constructor(IO,CONSTRAINS,ID){
        super(IO,CONSTRAINS,ID)
        this.onMediaNegotiationCallback = ()=>{
            this.signaling_socket.emit('new_properties', {properties:this.properties,media_state:{has_active_video: this.hasActiveVideo(),has_video:this.hasVideo(),has_muted_audio: this.hasMutedAudio(), has_muted_camera: this.hasMutedCamera(), has_active_camera: this.hasActiveCamera(), has_active_audio: this.hasActiveAudio(), isScreen: this.constrains.screen, audioDevices: this.audio_devices, videoDevices: this.video_devices}, "constrains": this.constrains })
        }
    }
    onMediaNegotion(callback){
        let old_mediaNegotiaotion = this.onMediaNegotiationCallback;
        this.onMediaNegotiationCallback = ()=>{
            callback()
            old_mediaNegotiaotion.apply(this)
        }
    }
    changeSdpSettings(properties){
        this.signaling_socket.emit('new_properties', {properties:this.properties,media_state:{has_active_video: this.hasActiveVideo(),has_video:this.hasVideo(),has_muted_audio: this.hasMutedAudio(), has_muted_camera: this.hasMutedCamera(), has_active_camera: this.hasActiveCamera(), has_active_audio: this.hasActiveAudio(), isScreen: this.constrains.screen, audioDevices: this.audio_devices, videoDevices: this.video_devices}, "constrains": this.constrains })
        for(let socket_id in this.peers){
            let peer_connection = this.peers[socket_id]
            this.negotiate(peer_connection, socket_id, this.properties)
        }
    }
    attachControlHandlers(){
        this.signaling_socket.on('mix_sources', (data)=>{
            this.mixVideoSources(data.constrains,data.screen, data.x,data.y,data.w,data.h);
        })
        this.signaling_socket.on('request_video', ()=>{
            this.requestVideo()
        })
        this.signaling_socket.on('request_audio', ()=>{
            this.requestAudio()
        })
        this.signaling_socket.on('mute_video', ()=>{
            this.muteVideo();
        })
        this.signaling_socket.on('mute_audio',()=>{
            this.muteAudio()
        })
        this.signaling_socket.on('audio_bitrate', (data)=>{
            this.setAudioBitrates(data.val)
        })
        this.signaling_socket.on('video_bitrate', (data)=>{
            this.setVideoBitrates(data.val)
        })
        this.signaling_socket.on('change_audio',(data)=>{
            this.changeAudioTrack(data.device_id);
        })
        this.signaling_socket.on('request_screen', data=>{
            this.requestScreen(data.constrains)
        })
        this.signaling_socket.on('change_video', (data)=>{
            this.changeVideoTrack(data.device_id);
        })

    }
    joinChannel(constrains){
        this.attachControlHandlers()
        this.old_mediaNegotiaotion = this.onMediaNegotiationCallback;
        this.signaling_socket.emit('join', {properties:this.properties,media_state:{has_active_video: this.hasActiveVideo(),has_video:this.hasVideo(),has_muted_audio: this.hasMutedAudio(), has_muted_camera: this.hasMutedCamera(), has_active_camera: this.hasActiveCamera(), has_active_audio: this.hasActiveAudio(), isScreen: this.is_screen_share, audioDevices: this.audio_devices, videoDevices: this.video_devices}, "constrains": this.constrains })
    }
}

