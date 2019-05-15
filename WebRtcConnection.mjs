
import Connection from './Connection.mjs'
import * as wrtc from 'wrtc'
const RTCPeerConnection = wrtc.default.RTCPeerConnection;
const RTCIceCandidate = wrtc.default.RTCIceCandidate;
export default class WebRtcConnection extends Connection {
	constructor(socket,peerId, constrains,options) {
		super(socket,peerId,constrains,options.dissconnectHandler);
		this.peerConnection = new RTCPeerConnection({
			sdpSemantics: 'unified-plan'
		});
    this.beforeOffer = options.beforeOffer
    this.onIceCandidate = options.onIceCandidate;
    this.beforeOffer(this.peerConnection);
  }
  attachIceCandidateListener(){
    this.peerConnection.addEventListener('icecandidate', this.onIceCandidate);
  }
  async applyAnswer(answer){
    await this.peerConnection.setRemoteDescription(answer);
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
  async doOffer(){
    try{
      
    const offer = await this.peerConnection.createOffer();
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

