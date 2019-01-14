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
    handshakeHandlers(peerId,relaySessionDescription){
        this.connections[peerId].socket.on('relayICECandidate', (config) => {
            let socket_ids = Object.keys(this.connections).map((k)=>{
                this.connections[k].socket.id
            })
            if(socket_ids.indexOf(config.socket_id) =! -1) {
                this.connections[].socket.emit('iceCandidate', {'peer_id': peerId, 'ice_candidate':  config.ice_candidate});
            }
        });
        this.connections[peerId].socket.on('relaySessionDescription', (config) => {
            if (config.peer_id in this.connections) {
                this.connections[config.peer_id].socket.emit('sessionDescription', {'peer_id': peerId, 'session_description': config.session_description, 'properties': config.properties});
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
