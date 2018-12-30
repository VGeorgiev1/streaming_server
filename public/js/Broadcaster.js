import Connection from "./Connection.js"
export default class Broadcaster extends Connection{ 
    constructor(SIGNALING_SERVER,CHANNEL,socket,CONSTRAINTS,id){
        super(SIGNALING_SERVER,CHANNEL,socket, 'broadcaster',id)
        this.constrains = {};
        if(CONSTRAINTS != 'screen-share'){
            CONSTRAINTS ? (
                      this.constrains.video = CONSTRAINTS.video,
                      this.constrains.audio = CONSTRAINTS.audio)
                    : this.findDevices((constrains)=>{this.constrains = constrains})
            this.local_media_stream = null
        }else{
            this.is_screen_share = true
            this.constrains.video = true
            this.constrains.audio = false
            this.local_media_stream = document.getElementById('mine').srcObject
        }
        this.createConnectDisconnectHandlers()
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
            this.regConnectHandler(()=>{console.log('im here')})
        }
    }
}