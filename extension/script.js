var SIGNALING_SERVER = "http://localhost";
var socket = io()
console.log(window.id)
let screen = new window.Broadcaster(SIGNALING_SERVER,socket,'screen-share',window.id)
screen.subscribeTo(window.channel, (mEl)=>{

    if($(mEl).is('video')){
        let div = $('<div class="embed-responsive embed-responsive-16by9">')
        div.append($(mEl))
        $('.card-body').prepend(div)
        let row = $('<div class="row">')
        let col = $('<div class="col-6">')
        let div_cont = $('<div class="border border-dark py-4">')
        let slider = $('<input type="range" name="videoBit" class="border border-dark">')
        slider.change(function(){
            connection.setVideoBitrates($(this).val())
        })
        let label = $('<label for="videoBit">').html("Video bitrate:")
        col.append(div_cont.append(label).append(slider))
        row.append(col)
        $('.container').append(row)
    }else{
        $('.card-body').append(mEl)
    }
})
screen.onBroadcaster((mEl)=>{
    $('.card-body').append(mEl)
})

