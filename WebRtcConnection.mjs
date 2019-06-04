
import Connection from './Connection.mjs'
import * as wrtc from 'wrtc'
const RTCPeerConnection = wrtc.default.RTCPeerConnection;
const RTCIceCandidate = wrtc.default.RTCIceCandidate;
export default class WebRtcConnection extends Connection {
	constructor(socket,peerId, constrains,options) {
		super(socket,peerId,constrains,null,options.disconnectHandler);
		this.peerConnection = new RTCPeerConnection({
			sdpSemantics: 'unified-plan'
    });
    this.peerConnection.ontrack = options.ontrack
    this.beforeOffer = options.beforeOffer
    this.onIceCandidate = ((event)=>{
      if (event.candidate) {
          socket.emit('iceCandidate',
          {
              'socket_id': socket.id,
              'ice_candidate': {
                  'sdpMLineIndex': event.candidate.sdpMLineIndex,
                  'candidate': event.candidate.candidate
              }
          });
      }
    })
    socket.on('relayICECandidate', (data)=>{
      this.applyCandidate(data.candidate)
    })
    
  }
  attachIceCandidateListener(){
    this.peerConnection.addEventListener('icecandidate', this.onIceCandidate);
  }
  setProperties(sdp, properties){
    if(properties.audioBitrate){
      sdp = this.sdp(sdp, 'audio', properties.audioBitrate)
    }
    if(properties.videoBitrate){
      sdp = this.sdp(sdp, 'video', properties.videoBitrate)
    }
    return sdp
  }
  async applyAnswer(answer, properties){
    await this.peerConnection.setRemoteDescription(answer);
  }
  sdp(sdp, media, bitrate){
    var lines = sdp.split("\n");
    let matchMedia = new RegExp("m="+media)
    let matches = matchMedia.exec(sdp)
    if(matches == null) return sdp;
    let mline = 0;
    for (var i = 0; i < lines.length; i++) {
        if (matchMedia.exec(lines[i]) != null) {
            mline = i
            break;
        }
    }
    mline++;
    lines.splice(mline,0,"b=AS:"+bitrate)
    return lines.join("\n")
  }
  applyCandidate(candidate){
    if(candidate){
      console.log(candidate)
      this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch(e=>{
        console.log(e)
      });
    }
  }
  async doAnswer(){
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
  }
  async doOffer(options){
    try{
    if(options.beforeOffer){
      await this.beforeOffer(this.peerConnection)
    }
    const offer = await this.peerConnection.createOffer();
    if(options.properties){
      offer.sdp = this.setProperties(offer.sdp,options.properties);
    }
    await this.peerConnection.setLocalDescription(offer);
    }catch(e){
      console.log(e)
    }
  }
	get localDescription() {
		return this.peerConnection.localDescription;
	}
	get remoteDescription() {
		return this.peerConnection.remoteDescription;
	}
	get signalingState() {
		return this.peerConnection.signalingState;
	}
}

