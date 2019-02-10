export default class Room{
    constructor(name,type){
        this.name = name
        this.type = type
        this.connections = {};
        this.alive = true;
        this.connectTriggers = []
    }
    getConnections(){
        return this.connections
    }
    triggerConnect(socket){
        for(let trigger of this.connectTriggers){
            trigger(socket)
        }
    }
    onConnect(callback){
        this.connectTriggers.push(callback)
    }
    obHandler(connection){
        connection.socket.on('topics', (topics)=>{
            this.topics = topics
        })
    }
    getPeers(){
        return this.connections;
    }
    regHandler(socket,handler, callback){
        socket.on(handler, callback)
    }


    setup_connection(socket, peerId, constrains, dissconnectHandler){
        this.connections[socket.id] = {}
        this.connections[socket.id].socket = socket;
        this.connections[socket.id].constrains = constrains
        this.connections[socket.id].userId = peerId
        this.handshakeHandlers(this.connections[socket.id]);
        this.connectDisconnectHandlers(this.connections[socket.id], dissconnectHandler)
        this.muteUnmuteHandler(this.connections[socket.id]);
        this.partHandler(this.connections[socket.id], dissconnectHandler)
        return this.connections[socket.id]

    }
    partHandler(connection, disconnectHandler){
        connection.socket.on('part', (details)=>{
            this.kickUser(connection.socket.id)
                        
            delete this.connections[connection.socket.id];
            if(disconnectHandler)
                disconnectHandler(connection.socket.id)
        })
    }
    connectDisconnectHandlers(connection, disconnectHandler){
        connection.socket.on('disconnect', () =>{
            this.kickUser(connection.socket.id)
            
            delete this.connections[connection.socket.id];
            if(disconnectHandler)
                disconnectHandler(connection.socket.id)
        });
    }
    muteUnmuteHandler(connection){
        connection.socket.on('new_constrains', (options)=>{
            this.connections[options.socket_id].constrains = options.constrains
            for(let id in this.connections){
                if(id != connection.socket.id){
                    this.connections[id].socket.emit('relayNewConstrains', options)
                }
            }
        })
    }
    handshakeHandlers(connection,relaySessionDescription){
        connection.socket.on('relayICECandidate', (config) => {
            if(config.socket_id in this.connections) {
                this.connections[config.socket_id].socket.emit('iceCandidate', {'socket_id': connection.socket.id, 'ice_candidate':  config.ice_candidate});
            }
        });
        connection.socket.on('relaySessionDescription', (config) => {
            if (config.socket_id in this.connections) {
                this.connections[config.socket_id].socket.emit('sessionDescription', {'socket_id': connection.socket.id, 'session_description': config.session_description, 'properties': config.properties});
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
            this.connections[c_id].socket.emit('removePeer', {'socket_id': id})
        }
    }
    closeRoom(){
        for(let connection in this.connections){
            this.kickUser(connection);
        }
        this.alive = false;
    }
}
