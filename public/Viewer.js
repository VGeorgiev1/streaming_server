import Connection from "./Connection.js"
var ICE_SERVERS = [
    {url:"stun:stun.l.google.com:19302"}
];
export default class Viewer extends Connection{ 
    constructor(SIGNALING_SERVER,CHANNEL){
        super(SIGNALING_SERVER, null, 'viewer')
        this.createConnectDisconnectHandlers()
      
    }
    createConnectDisconnectHandlers(){
        this.regConnectHandler(()=>{
            this.join_channel(this.constrains)
        })
        this.regDiscconectHandler(()=>{
            console.log('')
        })
    }
}