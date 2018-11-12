let screen_stream;
chrome.extension.onMessage.addListener((reqeust,sender, response) => {
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
        
            let body = document.getElementsByTagName('body')[0]
            let video = document.createElement('video')
            video.srcObject = stream
            video.autoplay = 'autoplay'
            body.appendChild(video)
            video.id = 'mine'
            var s = document.createElement('script');
            s.src = chrome.extension.getURL('script.js');
            (document.head || document.documentElement).appendChild(s);
        }).catch((err)=>{
            console.log(err)
        })
    })
    response('reponded!')
})