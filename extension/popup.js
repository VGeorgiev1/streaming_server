document.getElementById('startStreaming').onclick = (e)=>{
    e.preventDefault();
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        
        chrome.tabs.sendMessage(tabs[0].id, {screenShare: true}, (response)=>{})
    });
}