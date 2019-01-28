import Broadcaster from './Broadcaster.js'
let connection = null 
window.Broadcaster = Broadcaster;
window.onload = ()=>{
    var SIGNALING_SERVER = "http://localhost";
    connection = new Broadcaster("http://localhost", io() ,null,window.id)
    let connections = 1;
    let columnsOnMedia = 3;
    connection.subscribeTo(window.channel, (mEl)=>{
        let col = $(`<div class="card border-dark col-${columnsOnMedia} pr-0 pl-0 mr-5 mb-5">`)
        col.append($('<h5 class="card-header white-text text-center py-4">').html("Streaming"))
        let card_body = $('<div class="card-body">')
        if($(mEl).is('video')){
            let div_cont = $('<div class="embed-responsive embed-responsive-1by1">')
            col.prepend(card_body.append(div_cont.append($(mEl))))
           
            let div_video = $('<div class="border border-dark py-4">')
            let slider_video = $('<input type="range" min="50" max="500" name="videoBit" class="border border-dark">')
            slider_video.change(function(){
                connection.setVideoBitrates($(this).val())
            })
            let label_video = $('<label for="videoBit">').html("Video bitrate:")

            let div_audio = $('<div class="border border-dark py-4">')
            let slider_audio = $('<input type="range" min="8" max="50" name="audioBit" class="border border-dark">')
            slider_audio.change(function(){
                connection.setAudioBitrates($(this).val())
            })
            let label_audio = $('<label for="audioBit">').html("Audio bitrate:")

            card_body.append(div_audio.append(label_audio).append(slider_audio))
            card_body.append(div_video.append(label_video).append(slider_video))
        }else{
            let div_cont = $('<div class="text-center embed-responsive-item" mb-2">')
            div_cont.append($(mEl).attr("style", "width:60%"))
            col.append(card_body.prepend(div_cont))
            let div = $('<div class="border border-dark py-4">')
            let slider = $('<input type="range" name="audioBit" class="border border-dark">')
            slider.change(function(){
                connection.setAudioBitrates($(this).val())
            })
            let label = $('<label for="audioBit">').html("Audio bitrate:")
            card_body.append(div.append(label).append(slider))
           
            $('body').append(($('<button>').html('Mute').click(function(){
                connection.mute_audio()
            })))
        }
        
        let div = $('<div class="border border-dark">')
        

        let mics = connection.getAudioDevices()
        let cameras = connection.getVideoDevices();
        if(mics.length != 0){
            let label_mic = $('<label for="mics">').html("Select microfone:")
            let select_mics = $('<select name="mics" id="mic" class="form-control">').on('change', function(){
                connection.changeAudioTrack($(this).children(":selected").attr("id"))
            })
            for(let i=0;i < mics.length;i++){
                select_mics.append($(`<option id='${mics[i].deviceId}'>`).html(mics[i].label))
            }
            div.append(label_mic).append(select_mics)
        }
        if(cameras.length != 0){
            let label_cam = $('<label for="cams">').html("Select camera:")
            let select_cams = $('<select id="cams" class="form-control">').on('change', function(){
                connection.changeVideoTrack($(this).children(":selected").attr("id"))
            })
            for(let i=0;i < cameras.length;i++){
                select_cams.append($(`<option id='${cameras[i].deviceId}'>`).html(cameras[i].label))
            }
            div.append(label_cam).append(select_cams)
        }

        card_body.append(div)
        $('.row:nth-child(1)').append(col.append(card_body))
    })
    connection.onBroadcaster((mEl, socket_id)=>{

        let col = $(`<div id=${socket_id} class="card border-dark col-${columnsOnMedia} pr-0 pl-0 mr-5 mb-5">`)
        col.append($('<h5 class="card-header white-text text-center py-4">').html("Streaming"))
        let card_body = $('<div class="card-body">')
        let div_cont
        if($(mEl).is('video')){
            div_cont = $('<div class="embed-responsive embed-responsive-1by1">')
            card_body.append(div_cont.append($(mEl)))
        }else{
            div_cont = $('<div class="text-center embed-responsive-item mb-2">')
        
            card_body.append(div_cont.append($(mEl).attr("style", "width:60%")))
        }
        col.append(card_body)
        
        if(connections / 3 == 1){
            let breaker = $('<div class="w-100">');
            $('.row:nth-child(1)').append(breaker)
        }
        connections++
        $('.row:nth-child(1)').append(col)
    })
    connection.onPeerDiscconect((socket_id)=>{
        $(`#${socket_id}`).remove()
        connections--
        if(connections / 3 == 1){
            $(".w-100").last().remove();
        }
    })
}