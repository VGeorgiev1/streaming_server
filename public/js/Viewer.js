import Connection from "./Connection.js"
var ICE_SERVERS = [
    {url:"stun:stun.l.google.com:19302"}
];
export default class Viewer extends Connection{ 
    constructor(SIGNALING_SERVER,socket,id){
        super(SIGNALING_SERVER, socket, 'viewer',id)
        //this.createConnectDisconnectHandlers()
    }
    createConnectDisconnectHandlers(callback){
        this.regConnectHandler(()=>{
            this.join_channel()
            if(callback)
                callback()
        })
    }

}