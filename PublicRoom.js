class PublicRoom{
    constructor(NAME){
        this.name = NAME;
        this.peers = {}
    }
    addPeer(socket, userdata){
        if(socket.id in this.peers){
            console.log("["+ socket.id + "] ERROR: already joined ", channel);
            return;
        }
        for(let peer_id in this.peers){
            this.peers[peer_id].emit('addPeer', {'peer_id': socket.id, 'should_create_offer': false, 'userdata': userdata})
            socket.emit('addPeer', {'peer_id': peer_id, 'should_create_offer': true})
        }
        this.peers[socket.id] = socket
        this.createCDHandlers(socket)
        this.createRTCHandlers(socket)
    }
    createRTCHandlers(socket){
        let self = this
        socket.on('relayICECandidate', function(config) {
            if (config.peer_id in self.peers) {
                self.peers[config.peer_id].emit('iceCandidate', {'peer_id': socket.id, 'ice_candidate':  config.ice_candidate});
            }
        });
    
        socket.on('relaySessionDescription', function(config) {
            if (config.peer_id in self.peers) {
                self.peers[config.peer_id].emit('sessionDescription', {'peer_id': socket.id, 'session_description': config.session_description});
            }
        });
    }
    createCDHandlers(socket){
        let self = this
        socket.on('disconnect', function () {
            for(let peer in self.peers){
                self.part(peer)
            }
            delete self.peers[socket.id];
        });
    } 
    part(id) {
        this.peers[id].emit('removePeer', {'peer_id': id})
    }
}
module.exports = PublicRoom