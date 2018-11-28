export default class Room{
    constructor(name){
        this.name = name;
        this.connections = {};
        this.alive = true;
    }
    addPeer(socket, data){
        if(this.connections[socket.id])
            console.log('Peer already exist!');
        
        for(let id in this.connections){
            this.connections[id].emit('addPeer', {'peer_id': socket.id, 'should_create_offer': false, 'constrains': data.constrains})
            socket.emit('addPeer', {'peer_id': id, 'should_create_offer': true, 'constrains': this.connections[id].constrains})
        }
        
        this.connections[socket.id] = socket
        this.connections[socket.id].constrains = data.constrains
        this.handshakeHandlers(socket);
        this.connectDisconnectHandlers(socket)
    }
    connectDisconnectHandlers(socket, disconnectHandler){
        socket.on('disconnect', () =>{
            this.kickUser(socket.id)
            delete this.connections[socket.id];
            if(disconnectHandler)
                disconnectHandler()
        });
    }
    handshakeHandlers(socket, onRelayIceCandidate,relaySessionDescription){
        socket.on('relayICECandidate', (config) => {
            if (config.peer_id in this.connections) {
                this.connections[config.peer_id].emit('iceCandidate', {'peer_id': socket.id, 'ice_candidate':  config.ice_candidate});
            }
        });
        
        socket.on('relaySessionDescription', (config) => {
            if (config.peer_id in this.connections) {
                this.connections[config.peer_id].emit('sessionDescription', {'peer_id': socket.id, 'session_description': config.session_description});
            }
        });
    }
    getPeer(id){
        if(!this.connections[id])
            console.log('There is no such a peer!');
        return this.connections[id];
    }
    kickUser(id){
        for(let c_id in this.connections){
            this.connections[c_id].emit('removePeer', {'peer_id': id})
        }
    }
    closeRoom(){
        for(let connection in this.connections){
            this.kickUser(connection);
        }
        this.alive = false;
    }
}