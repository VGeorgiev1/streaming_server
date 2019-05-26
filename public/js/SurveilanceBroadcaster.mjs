import Broadcaster from "./Broadcaster.js"

export default class SurveilanceBroadcaster extends Broadcaster{
    constructor(IO,CONSTRAINS,ID){
        super(ID,CONSTRAINS,ID)
        this.type="surveillance_broadcaster"
    }
    attachHandlers(){
        this.signaling_socket.on('request_video', ()=>{
            this.requestVideo()
            this.signaling_socket.emit('properties', {properties:{propertis:this.properties,has_muted_audio: this.hasMutedAudio(), has_muted_camera: this.hasMutedCamera(), has_active_camera: this.hasActiveCamera(), has_active_audio: this.hasActiveAudio(), isScreen: this.is_screen_share, audioDevices: this.audio_devices, videoDevices: this.video_devices}, "constrain": this.constrains })
        })
        this.signaling_socket.on('request_audio', ()=>{
            this.requestAudio()
            this.signaling_socket.emit('properties', {properties:{propertis:this.properties,has_muted_audio: this.hasMutedAudio(), has_muted_camera: this.hasMutedCamera(), has_active_camera: this.hasActiveCamera(), has_active_audio: this.hasActiveAudio(), isScreen: this.is_screen_share, audioDevices: this.audio_devices, videoDevices: this.video_devices}, "constrain": this.constrains })
        })
        this.signaling_socket.on('mute_video', ()=>{
            this.muteVideo();
        })
        this.signaling_socket.on('mute_audio',()=>{
            this.muteAudio()
            this.signaling_socket.emit('properties', {properties:{propertis:this.properties,has_muted_audio: this.hasMutedAudio(), has_muted_camera: this.hasMutedCamera(), has_active_camera: this.hasActiveCamera(), has_active_audio: this.hasActiveAudio(), isScreen: this.is_screen_share, audioDevices: this.audio_devices, videoDevices: this.video_devices}, "constrain": this.constrains })
        })
        this.signaling_socket.on('audio_bitrate', (data)=>{
            this.setAudioBitrates(data.val)
            this.signaling_socket.emit('properties', {properties:{propertis:this.properties,has_muted_audio: this.hasMutedAudio(), has_muted_camera: this.hasMutedCamera(), has_active_camera: this.hasActiveCamera(), has_active_audio: this.hasActiveAudio(), isScreen: this.is_screen_share, audioDevices: this.audio_devices, videoDevices: this.video_devices}, "constrain": this.constrains })

        })
        this.signaling_socket.on('video_bitrate', (data)=>{
            this.setVideoBitrates(data.val)
            this.signaling_socket.emit('properties', {properties:{propertis:this.properties,has_muted_audio: this.hasMutedAudio(), has_muted_camera: this.hasMutedCamera(), has_active_camera: this.hasActiveCamera(), has_active_audio: this.hasActiveAudio(), isScreen: this.is_screen_share, audioDevices: this.audio_devices, videoDevices: this.video_devices}, "constrain": this.constrains })

        })
        this.signaling_socket.on('change_audio',(data)=>{
            this.changeAudioTrack(data.device_id);
            this.signaling_socket.emit('properties', {properties:{propertis:this.properties,has_muted_audio: this.hasMutedAudio(), has_muted_camera: this.hasMutedCamera(), has_active_camera: this.hasActiveCamera(), has_active_audio: this.hasActiveAudio(), isScreen: this.is_screen_share, audioDevices: this.audio_devices, videoDevices: this.video_devices}, "constrain": this.constrains })

        })
        this.signaling_socket.on('change_video', (data)=>{
            this.changeVideoTrack(data.device_id);
            this.signaling_socket.emit('properties', {properties:{propertis:this.properties,has_muted_audio: this.hasMutedAudio(), has_muted_camera: this.hasMutedCamera(), has_active_camera: this.hasActiveCamera(), has_active_audio: this.hasActiveAudio(), isScreen: this.is_screen_share, audioDevices: this.audio_devices, videoDevices: this.video_devices}, "constrain": this.constrains })

        })

    }
    joinChannel(constrains){
        this.attachHandlers()
        this.signaling_socket.emit('join', {properties:{propertis:this.properties,has_muted_audio: this.hasMutedAudio(), has_muted_camera: this.hasMutedCamera(), has_active_camera: this.hasActiveCamera(), has_active_audio: this.hasActiveAudio(), isScreen: this.is_screen_share, audioDevices: this.audio_devices, videoDevices: this.video_devices},"id": this.id, "constrain": constrains })
    }
}
