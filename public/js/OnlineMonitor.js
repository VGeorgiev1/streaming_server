let monitoring_socket = io()
window.localLinkClicked = false;
window.monitoring_socket = monitoring_socket
window.monitoring_socket.on('call', (data)=>{
    $('#channel').attr('href', '/call/' + data.channel)
    $('#callLabel').html(data.caller + ' is calling!')
    $('#call').modal('show');
})

$("a, button").click(function() {
    window.localLinkClicked = true;
});

window.onbeforeunload = function() {
    if (window.localLinkClicked) {
        window.localLinkClicked = false
    } else {
        window.monitoring_socket.emit('page_left')
    }
}