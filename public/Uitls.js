async function findDevices(callback){
    navigator.mediaDevices.enumerateDevices().then(devices =>{
        let use_audio, use_video = false
        for(let i=0;i<devices.length;i++){
            if(devices[i].kind === 'audioinput') use_audio = true;
            if(devices[i].kind === 'videoinput') use_video = true;
        }
        callback({'audio': use_audio, 'video': use_video})
    })
}
function findWebRTC(){
    return (navigator.getUserMedia ||
           navigator.webkitGetUserMedia ||
           navigator.mozGetUserMedia ||
           navigator.msGetUserMedia)
}
function attachMediaStream(element, stream){
    element.srcObject = stream;
}
function setup_media(constrains,stream,elem,options,callback){
    var media = constrains.use_video ? $("<video>") : $("<audio>");
    media.attr("autoplay", "autoplay");
    media.prop("muted", options.muted); /* always mute ourselves by default */
    media.attr("controls", "");
    elem.append(media);
    attachMediaStream(media[0], stream);
    if(options.returnElm) return media
}
function setup_local_media(constrains, elem, callback, errorback) {
    navigator.getUserMedia = findWebRTC()
    console.log(constrains)
    navigator.getUserMedia(constrains, 
        (stream)=>{
            
            setup_media(constrains,stream, elem,{muted:true})
            if (callback) callback(stream);
        },
        ()=>{
            alert("You chose not to provide access to the camera/microphone, demo will not work.");
            if (errorback) errorback();
        }
    )
      
}
export { findDevices, findWebRTC, attachMediaStream ,setup_local_media,setup_media};