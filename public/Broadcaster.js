import Connection from "./Connection.js"

export default class Broadcaster extends Connection{ 
    constructor(SIGNALING_SERVER,CHANNEL,CONSTRAINTS,RULE){
        super(SIGNALING_SERVER,null, 'broadcaster')
        this.constrains = {};
        if(CONSTRAINTS != 'screen-share'){
            CONSTRAINTS ? (
                      this.constrains.video = CONSTRAINTS.video,
                      this.constrains.audio = CONSTRAINTS.audio)
                    : this.findDevices((constrains)=>{this.constrains = constrains})
            this.local_media_stream = null
        }else{
            this.is_screen_share = true
            this.local_media_stream = document.getElementById('mine').srcObject
        }
        this.createConnectDisconnectHandlers()
        this.createHandlers()
    }
    
    createConnectDisconnectHandlers(){
        if(!this.is_screen_share){
            this.regConnectHandler(()=> {
                if (this.local_media_stream != null) {  /* ie, if we've already been initialized */
                    return; 
                }
                this.setup_local_media(this.constrains, $('body'),
                (stream) => {
                    this.local_media_stream = stream
                    this.join_channel(this.constrains);
                },
                () => {
                    console.log("Couldn't set up media!")
                })
            })
        }else{
            this.regConnectHandler(this.join_channel)
        }
        this.regDiscconectHandler(()=>{
            for (let peer_id in this.peer_media_elements) {
                this.peer_media_elements[peer_id].remove();
            }
            for (let peer_id in this.peers) {
                this.peers[peer_id].close();
            }
            this.peers = {};
            this.peer_media_elements = {};
        })
    }
    createHandlers(){
        this.regHandler('removePeer', (config)=>{
            var peer_id = config.peer_id;
            if (peer_id in this.peer_media_elements) {
                this.peer_media_elements[peer_id].remove();
            }
            if (peer_id in this.peers) {
                this.peers[peer_id].close();
            }
            delete this.peers[peer_id];
            delete this.peer_media_elements[config.peer_id];
        })
    }
}