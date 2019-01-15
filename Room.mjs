export default class Room{
    constructor(name,type){
        this.name = name
        this.type = type
        this.connections = {};
        this.alive = true;
    }
    rulesHandler(socket){
        socket.on('getRules', ()=>{
            socket.emit('rules', this.rules)
        })
    }

    connectDisconnectHandlers(peerId, disconnectHandler){
        this.connections[peerId].socket.on('disconnect', () =>{
            this.kickUser(peerId)
            delete this.connections[peerId];
            if(disconnectHandler)
                disconnectHandler(peerId)
        });
    }
    handshakeHandlers(socketId,relaySessionDescription){
        this.connections[socketId].socket.on('relayICECandidate', (config) => {
            if(config.socket_id in this.connections) {
                this.connections[config.socket_id].socket.emit('iceCandidate', {'socket_id': socketId, 'ice_candidate':  config.ice_candidate});
            }
        });
        this.connections[socketId].socket.on('relaySessionDescription', (config) => {
            if (config.socket_id in this.connections) {
                this.connections[config.socket_id].socket.emit('sessionDescription', {'socket_id': socketId, 'session_description': config.session_description, 'properties': config.properties});
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
            this.connections[c_id].socket.emit('removePeer', {'peer_id': id})
        }
    }
    closeRoom(){
        for(let connection in this.connections){
            this.kickUser(connection);
        }
        this.alive = false;
    }
}
