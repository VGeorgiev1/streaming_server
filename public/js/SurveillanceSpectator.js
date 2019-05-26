import Viewer from "./Viewer.js"


export default class SurveillanceSpectator extends Viewer{
    constructor(IO,ID){
        super(IO,ID)
        this.onMediaNegotiationCallback;
    }
    joinChannel(){
        this.signaling_socket.on('properties',(data)=>{
            this.peers[data.id].properties = data.properties
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
        console.log(this.peers)
        return this.peers[id].properties.has_video
    }
    hasActiveAudio(id){
        return this.peers[id].properties.has_active_audio;
    }
    hasMutedAudio(id){
        return this.peers[id].properties.has_muted_audio;
    }
    isScreen(id){
        return this.peers[id].properties.isScreen;
    }
    hasActiveCamera(id){
        return this.peers[id].properties.has_active_camera;
    }
    hasMutedCamera(id){
        return this.peers[id].properties.has_muted_camera;
    }
    getAudioDevices(id){
        return this.peers[id].properties.audioDevices;
    }
    getVideoDevices(id){
        return this.peers[id].properties.videoDevices;
    }
    onMediaNegotiation(callback){
        this.onMediaNegotiationCallback = callback;
    }
    requestVideo(id){
        this.signaling_socket.emit('request_video', {socket_id: id})
    }
    requestAudio(id){
        this.signaling_socket.emit('request_audio', {socket_id: id})
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
