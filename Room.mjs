
import SocketIO from 'socket.io';
export default class Room{
    constructor(name,type,channel,io){
        this.name = name
        this.type = type
        this.connections = {};
        this.alive = true;
        this.connectTriggers = []
        this.channel = channel;

        this.nsp = io.of('/' + this.channel);
        this.nsp.on('connection', (socket)=>{
            socket.on('get_room_details', function(channel){ 
                socket.emit('room_details', {type:this.type,rules:this.rules,active:this.active})
            })
            socket.on('join', (data)=>{
                console.log('join')
                this.addSocket(socket,data.constrains, data.id)
            })
        });
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


    setupConnection(socket, peerId, constrains, dissconnectHandler){
        this.connections[socket.id] = {}
        this.connections[socket.id].socket = socket;
        this.connections[socket.id].constrains = constrains
        this.connections[socket.id].peerId = peerId
        this.handshakeHandlers(this.connections[socket.id]);
        this.disconnectHandler(this.connections[socket.id], dissconnectHandler)
        this.muteUnmuteHandler(this.connections[socket.id]);
        this.partHandler(this.connections[socket.id], dissconnectHandler)
        return this.connections[socket.id]
    }

    disconnectHandler(connection, disconnectHandler){
        connection.socket.on('disconnect', () =>{
            this.removePeer(connection.socket.id)
            if(disconnectHandler)
                disconnectHandler(connection.socket.id)
        });
    }
    removePeer(id){
        this.kickUser(id)  
        delete this.connections[id];
    }
    kickUser(id){
        for(let c_id in this.connections){
            this.connections[c_id].socket.emit('removePeer', {'socket_id': id})
        }
    }
    partHandler(connection, disconnectHandler){
        connection.socket.on('part', (details)=>{
            this.removePeer(connection.socket.id)
            if(disconnectHandler)
                disconnectHandler(id)
        })
    }

    muteUnmuteHandler(connection){
        connection.socket.on('new_constrains', (options)=>{ 
            this.connections[connection.socket.id].constrains = options
            for(let id in this.connections){
                if(id != connection.socket.id){
                    this.connections[id].socket.emit('relayNewConstrains', {constrains: options, socket_id: connection.socket.id})
                }
            }
        })
    }
    handshakeHandlers(connection,relaySessionDescription){
        connection.socket.on('relayICECandidate', (config) => {
            if(config.socket_id in this.connections) {
                this.connections[config.socket_id].socket.emit('iceCandidate',
                    {'socket_id': connection.socket.id, 'ice_candidate':  config.ice_candidate});
            }
        });
        connection.socket.on('relaySessionDescription', (config) => {
            if (config.socket_id in this.connections) {
                this.connections[config.socket_id].socket.emit('sessionDescription',
                    {'socket_id': connection.socket.id, 'session_description': config.session_description, 'properties': config.properties});
            }
        });
    }
    getPeer(id){
        if(!this.connections[id])
            console.log('There is no such a peer!');
        return this.connections[id];
    }

    closeRoom(){
        for(let connection in this.connections){
            this.kickUser(connection);
        }
        this.alive = false;
    }
}
