import Viewer from './Viewer.js'
import Player from './Player.js'
import Chat from './Chat.mjs'
let connection = null;

window.onload = ()=>{
    connection = new Viewer("http://localhost",io,id)
    let player =null;
    connection.subscribeTo(window.channel, ()=>{
        console.log('what')
        connection.onBroadcaster((mEl, socket_id, constrains)=>{
                console.log(constrains)
                player = new Player({'media': mEl, 'socket_id': socket_id, 'constrains': constrains, reso: '16by9'},9);
                let chat = new Chat(connection.getSocket())
                $('.big-container').append(chat.getChatInstance())

                $('.row').append(player.getPlayer())
                connection.onBroadcastNegotiation((constrains,mEl)=>{
                    console.log(constrains)
                    player.negotiatePlayer(constrains, mEl)
                })
            
        })

    })

}
    // let stereo = false
    // let socket = io('/' + window.channel);
    // let videos = document.createElement('div');
    // let remoteVideo = document.createElement('video');
    // remoteVideo.autoplay = true;
    // socket.emit('join', { "constrains": null , "id": window.id})
    // socket.on('addPeer',async (data)=>{
    //     const localPeerConnection = new RTCPeerConnection({
    //         sdpSemantics: 'unified-plan'
    //     });
    //     localPeerConnection.ontrack = (event) =>{
    //         console.log(event)
    //     }
    //     socket.on('iceCandidate', ( data )=>{
    //         console.log(data.socket_id)
    //         console.log(socket.id)
    //         //f(data.socket_id == socket.id){
    //             console.log('icecandidate?')
    //             localPeerConnection.addIceCandidate(new RTCIceCandidate(data.ice_candidate));
    //         //}
    //     });
    //     try {
    //         await localPeerConnection.setRemoteDescription(data.localDescription);
    //         localPeerConnection.onicecandidate = (event) => {
    //             if (event.candidate) {
    //                 socket.emit('relayICECandidate', {
    //                     'socket_id': data.socket_id,
    //                     'ice_candidate': {
    //                         'sdpMLineIndex': event.candidate.sdpMLineIndex,
    //                         'candidate': event.candidate.candidate
    //                     }
    //                 });
    //             }
    //         };
            
    //         const remoteStream = new MediaStream(localPeerConnection.getReceivers().map(receiver => receiver.track));
    //         console.log(remoteStream)
    //         remoteVideo.srcObject = remoteStream;
    //         console.log(remoteVideo.srcObject.getVideoTracks());  
    //         // NOTE(mroberts): This is a hack so that we can get a callback when the
    //         // RTCPeerConnection is closed. In the future, we can subscribe to
    //         // "connectionstatechange" events.
    //         const { close } = localPeerConnection;
    //         localPeerConnection.close = function() {
    //             remoteVideo.srcObject = null;

    //             localStream.getTracks().forEach(track => track.stop());

    //             return close.apply(this, arguments);
    //         };

    //         const originalAnswer = await localPeerConnection.createAnswer();

    //         const updatedAnswer = new RTCSessionDescription({
    //         type: 'answer',
    //         sdp: stereo ? enableStereoOpus(originalAnswer.sdp) : originalAnswer.sdp
    //         });

    //         await localPeerConnection.setLocalDescription(updatedAnswer);

    //         socket.emit('relaySessionDescription', { session_description: localPeerConnection.localDescription, socket_id: data.socket_id });
    //         videos.appendChild(remoteVideo);
    //         document.getElementsByTagName('body')[0].appendChild(videos);
    //         return localPeerConnection;
    //     } catch (error) {
    //         localPeerConnection.close();
    //         throw error;
    //     }
    // })