import Connection from "./Connection.js"
var ICE_SERVERS = [
    {url:"stun:stun.l.google.com:19302"}
];
export default class Viewer extends Connection{ 
    constructor(SIGNALING_SERVER,CHANNEL,socket,id){
        super(SIGNALING_SERVER, CHANNEL, socket, 'viewer',id)
        this.createConnectDisconnectHandlers()
    }
    createConnectDisconnectHandlers(){
        this.regConnectHandler(()=>{
            this.join_channel()
        })
        this.regDiscconectHandler(()=>{})
    }
}