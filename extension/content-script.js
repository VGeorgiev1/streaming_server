
chrome.extension.onMessage.addListener((reqeust,sender, respone) => {
    let port = chrome.runtime.connect();
    port.onMessage.addListener(function (obj) {
        console.log(obj.sourceId)
        navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: "desktop",
                    chromeMediaSourceId: obj.sourceId
                }
            }
        }).then((stream)=>{
            console.log(stream)
            let body = document.getElementsByTagName('body')[0]
            let video = document.createElement('video')
            video.srcObject = stream
            video.autoplay = 'autoplay'
            body.appendChild(video)
            //.appendChild(document.createElement("video").src = sream)
        }).catch((err)=>{
            console.log(err)
        })
    })
    response('reponded!')
})