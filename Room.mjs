export default class Room{
    constructor(name,type){
        this.name = name
        this.type = type
        this.connections = {};
        this.alive = true;
    }
    obHandler(connection){
        connection.socket.on('tensor', (obj)=>{
            const numChannels = 4;
            const pixels = new Int32Array(Object.values(obj.data))
            let pixel_tf = tf.default.tensor(pixels);
           
            const outShape = [obj.height, obj.width, numChannels];
            const input = tf.default.tensor(pixels, outShape, 'int32');
            const sliced = tf.default.slice(input,[0,0], [obj.height, obj.width, 3])
            
            model.detect(sliced).then((predictions)=>{
                
                connection.socket.emit("predictions", predictions);

            })
        })
    }
    rulesHandler(socket){
        socket.on('getRules', ()=>{
            socket.emit('rules', this.rules)
        })
    }
    setup_connection(socket, peerId, constrains){
        this.connections[socket.id] = {}
        this.connections[socket.id].socket = socket;
        this.connections[socket.id].constrains = constrains
        this.connections[socket.id].userId = peerId
        return this.connections[socket.id]
    }
    connectDisconnectHandlers(connection, disconnectHandler){
        connection.socket.on('disconnect', () =>{
            this.kickUser(connection.socket.id)
            delete this.connections[connection.socket.id];
            if(disconnectHandler)
                disconnectHandler(connection.socket.id)
        });
    }
    handshakeHandlers(connection,relaySessionDescription){
        connection.socket.on('relayICECandidate', (config) => {
            if(config.socket_id in this.connections) {
                //connection.socket.emit('iceCandidate', {'socket_id': config.socket_id, 'ice_candidate':  config.ice_candidate})
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
