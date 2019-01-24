let screen_stream;
chrome.extension.onMessage.addListener((reqeust,sender, response) => {
    let port = chrome.runtime.connect();
    port.onMessage.addListener(function (obj) {
        navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: "desktop",
                    chromeMediaSourceId: obj.sourceId
                }
            }
        }).then((stream)=>{
            //console.log(stream)
            let body = document.getElementsByTagName('body')[0]
            let video = document.createElement('video')
            video.style.display = 'none'
            video.srcObject = stream
            video.autoplay = 'autoplay'
            video.id = 'screen'
            body.append(video)
            var s = document.createElement('script');
            s.src = chrome.extension.getURL('script.js');
            (document.head || document.documentElement).appendChild(s);
        }).catch((err)=>{
            console.log(err)
        })
    })
    response('reponded!')
})