import Viewer from "./Viewer.js"


export default class SurveillanceSpectator extends Viewer{
    constructor(IO,ID){
        super(IO,ID)
        this.onMediaNegotiationCallback;
    }
    joinChannel(){
        this.signaling_socket.on('properties',(data)=>{
            this.peers[data.id].properties = data.properties
            this.peers[data.id].constrains = data.constrains
            this.peers[data.id].media_state = data.media_state  
            this.onMediaNegotiationCallback()
        })
        this.signaling_socket.emit('join', {'constrains': null, 'id': this.id, 'properties': null})
    }
    getConstrains(id){
        return this.peers[id].constrains
    }
    getMediaElement(id){
        return this.peer_media_elements[id]
    }
    hasVideo(id){
        return this.peers[id].media_state.has_video
    }
    hasActiveAudio(id){
        return this.peers[id].media_state.has_active_audio;
    }
    hasMutedAudio(id){
        return this.peers[id].media_state.has_muted_audio;
    }
    isScreen(id){
        return this.peers[id].media_state.isScreen;
    }
    hasActiveCamera(id){

        return this.peers[id].media_state.has_active_camera;
    }
    hasActiveVideo(id){
        return this.peers[id].media_state.has_active_video
    }
    hasMutedCamera(id){
        return this.peers[id].media_state.has_muted_camera;
    }
    getAudioDevices(id){
        return this.peers[id].media_state.audioDevices;
    }
    getVideoDevices(id){
        return this.peers[id].media_state.videoDevices;
    }
    onMediaNegotiation(callback){
        this.onMediaNegotiationCallback = callback;
    }
    mixVideoSources(constrains,screen,x,y,w,h,id){
        this.signaling_socket.emit('mix_sources', {socket_id: id, constrains: constrains, screen: screen, x:x,y:y,w:w,h:h})
    }
    requestVideo(id){
        this.signaling_socket.emit('request_video', {socket_id: id})
    }
    requestAudio(id){
        this.signaling_socket.emit('request_audio', {socket_id: id})
    }
    requestScreen(constrains,id){
        this.signaling_socket.emit('request_screen', {socket_id: id, constrains: constrains})
    }
    muteAudio(id){
        this.signaling_socket.emit('mute_audio', {socket_id: id})
    }
    muteVideo(id){
        this.signaling_socket.emit('mute_video', {socket_id: id})
    }
    setAudioBitrates(val,id){
        this.signaling_socket.emit('audio_bitrate', {val: val, socket_id: id})
    }
    setVideoBitrates(val,id){
        this.signaling_socket.emit('video_bitrate', {val: val,socket_id: id})
    }
    changeAudioTrack(track_id, id){
        this.signaling_socket.emit('change_audio', {device_id: id, socket_id: id})
    }
    changeVideoTrack(track_id,id){
        this.signaling_socket.emit('change_video', {device_id: id, socket_id: id})
    }
    
}
