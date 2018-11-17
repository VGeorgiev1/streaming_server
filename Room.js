export class Room{
    constructor(name){
        this.name = name;
        this.connections = {};
        this.alive = true;
    }
    addPeer(socket){
        if(this.connections[socket.id])
            console.log('Peer already exist!');
        this.connections[socket.id] = socket
        this.handshakeHandlers(socket);
        this.connectDisconnectHandlers(socket)
    }
    connectDisconnectHandlers(socket, connectHandler, disconnectHandler){
        socket.on('disconnect', disconnectHandler);
        socket.on('connect', connectHandler);
    }
    handshakeHandlers(socket, onRelayIceCandidate ,relaySessionDescription){
        socket.on('relayICECandidate', (config) => {
            onRelayIceCandidate(config);
        });
        socket.on('relaySessionDescription', (config) => {
            relaySessionDescription(config);
        });
    }
    getPeer(id){
        if(!this.connections[id])
            console.log('There is no such a peer!');
        return this.connections[id];
    }
    kickUser(id){
        this.connections[id].emit('removePeer', {'peer_id': id})
        
        delete this.connections[id];
    }
    closeRoom(){
        for(let connection in this.connections){
            this.kickUser(connection.id);
        }
        this.alive = false;
    }
}
