var SIGNALING_SERVER = "http://localhost";
var socket = io()
console.log(window.id)
let screen = new window.Broadcaster(SIGNALING_SERVER,socket,'screen-share',window.id)
screen.subscribeTo(window.channel, (mEl)=>{

    if($(mEl).is('video')){
        let div = $('<div class="embed-responsive embed-responsive-16by9">')
        div.append($(mEl))
        $('.card-body').prepend(div)
    }else{
        $('.card-body').append(mEl)
    }
    $('body').append($('<input id="slider3" type="range" min="50" max="500" value="256">').change(function(){
        screen.setVideoBitrates($(this).val())
    }))
})
screen.onBroadcaster((mEl)=>{
    $('.card-body').append(mEl)
})

