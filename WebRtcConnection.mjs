
import Connection from './Connection.mjs'
import * as wrtc from 'wrtc'
const RTCPeerConnection = wrtc.default.RTCPeerConnection;
const RTCIceCandidate = wrtc.default.RTCIceCandidate;
export default class WebRtcConnection extends Connection {
	constructor(id, beforeOffer, onIceCandidate) {
		super(id);
		this.peerConnection = new RTCPeerConnection({
			sdpSemantics: 'unified-plan'
		});
    this.beforeOffer = beforeOffer
    this.onIceCandidate = onIceCandidate;
    this.peerConnection.ontrack = function ontrack(event){
      console.log(event)
    }
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
        //console.log(e)
      });
    }
  }
  async doAnswer(){
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
  }
  async doOffer(){
    
    const offer = await this.peerConnection.createOffer();
		await this.peerConnection.setLocalDescription(offer);
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

