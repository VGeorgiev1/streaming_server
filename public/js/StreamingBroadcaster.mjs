import Broadcaster from './Broadcaster.js'
var SIGNALING_SERVER = "http://localhost";

document.addEventListener('stream_ready', function() {

    let screen = new Broadcaster(SIGNALING_SERVER,io(),'screen-share',window.id)
    screen.subscribeTo(window.channel, (mEl)=>{
        
        if($(mEl).is('video')){
            let div = $('<div class="embed-responsive embed-responsive-16by9">')
            div.append($(mEl))
            let header = $('<h5 class="card-header white-text text-center py-4">').html("Streaming");

            
            let row = $('<div class="row">')
            let col = $('<div class="card border-dark col-12 pr-0 pl-0 mr-5 mb-5">')
            let card_body = $('<div class="card-body">')
            let div_cont = $('<div class="border border-dark py-4">')


            let slider = $('<input type="range" name="videoBit" min="50" max="500" class="border border-dark">')
            slider.change(function(){
                connection.setVideoBitrates($(this).val())
            })
            let label = $('<label for="videoBit">').html("Video bitrate:")
            col.append(header)
            row.append(col.append(card_body.append(div_cont.append(div).append(label).append(slider))))
            $('.container').append(row)
        }else{
            $('.card-body').append(mEl)
        }
    })
});
