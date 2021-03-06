let screen_stream;
chrome.extension.onMessage.addListener((reqeust,sender, response) => {
    let port = chrome.runtime.connect();
    port.onMessage.addListener(function (obj) {
        navigator.mediaDevices.getUserMedia({
            audio:{ 
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: obj.sourceId
                }
            },
            video:{ 
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: obj.sourceId
                    }
            }
        }).then((stream)=>{
            let body = document.getElementsByTagName('body')[0]
            let video = document.createElement('video')
            
            video.style.display = 'none'
            video.srcObject = stream
            video.autoplay = 'autoplay'
            video.id = 'screen'
            body.append(video)
            var selectionFired = new CustomEvent("screen_ready");
            document.dispatchEvent(selectionFired)
           
        }).catch((e)=>{
            console.log(e.message)
        })
    })
    response('reponded!')
})