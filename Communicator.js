class Communicator{
    constructor(io){
        this.io = io;
        this.channels = [];
    }
    subscribe(socket, channel){
        this.channels.push(channel)
        socket.join(channel)
    }
}