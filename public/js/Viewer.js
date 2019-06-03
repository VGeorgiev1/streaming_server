import Connection from "./Connection.js"
var ICE_SERVERS = [
    {url:"stun:stun.l.google.com:19302"}
];
export default class Viewer extends Connection{ 
    constructor(io,id){
        super(io,id)
        this.createConnectDisconnectHandlers= (callback) =>{
            this.regConnectHandlers(()=>{
                this.joinChannel()
                if(callback)
                    callback()
            })
        }
    }

}