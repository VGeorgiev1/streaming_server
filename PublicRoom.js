class PublicRoom{
    constructor(NAME){
        this.name = NAME;
        this.peers = {}
    }
    addPeer(socket){
        if(socket.id in this.peers){
            console.log("["+ socket.id + "] ERROR: already joined ", channel);
            return;
        }
        for(peer in this.peers){
            peer.emit('addPeer', {'peer_id': socket.id, 'should_create_offer': false})
            socket.emit('addPeer', {'peer_id': id, 'should_create_offer': true})
        }
        this.peers[socket.id] = socket
        this.createCDHandlers(socket)
        this.createRTCHandlers(socket)
    }
    createRTCHandlers(socket){
        socket.on('relayICECandidate', function(config) {
            if (config.peer_id in this.peers) {
                this.peers[peer].emit('iceCandidate', {'peer_id': socket.id, 'ice_candidate':  config.ice_candidate});
            }
        });
    
        socket.on('relaySessionDescription', function(config) {
            if (peer_id in this.peers) {
                this.peers[peer_id].emit('sessionDescription', {'peer_id': socket.id, 'session_description': config.session_description});
            }
        });
    }
    createCDHandlers(socket){
        socket.on('disconnect', function () {
            for(peer in this.peers){
                this.part(peer.id)
            }
            delete this.peers[socket.id];
        });
    } 
    part(id) {
        this.peers[id].emit('removePeer', {'peer_id': id})
    }
}
module.exports = PublicRoom