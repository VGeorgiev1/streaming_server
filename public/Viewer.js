import Connection from "./Connection.js"
var ICE_SERVERS = [
    {url:"stun:stun.l.google.com:19302"}
];
export default class Broadcaster extends Connection{ 
    constructor(CHANNEL){
        super()
        this.createConnectDisconnectHandlers()
    }
    onConnectDissconnectHandle(){
        this.regConnectHandler(()=>{
            this.join_channel({type: 'viewer'})
        })
    }
    
}