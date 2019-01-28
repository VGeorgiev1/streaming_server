var front_port;
chrome.runtime.onConnect.addListener(function(port) {
    front_port = port
    chrome.desktopCapture.chooseDesktopMedia(['screen', 'window','audio'],front_port.sender.tab, accessToRecord);
});


function accessToRecord(id){
    
    front_port.postMessage({
        sourceId: id
    });
}
