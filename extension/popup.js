document.getElementById('startStreaming').onclick = (e)=>{
    e.preventDefault();
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        console.log(tabs[0]);
        chrome.tabs.sendMessage(tabs[0].id, {screenShare: true}, (response)=>{console.log(response)})
    });
}