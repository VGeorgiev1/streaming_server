async function findDevices(callback){
    navigator.mediaDevices.enumerateDevices().then(devices =>{
        for(let i=0;i<devices.length;i++){
            if(devices[i].kind === 'audioinput') this.constrains.use_audio = true;
            if(devices[i].kind === 'videoinput') this.constrains.use_video = true;
        }
        callback()
    })
}
function findRTC(){
        return (navigator.getUserMedia ||
               navigator.webkitGetUserMedia ||
               navigator.mozGetUserMedia ||
               navigator.msGetUserMedia)
}
function createMediaCommunicator(constrains,element,options){

}