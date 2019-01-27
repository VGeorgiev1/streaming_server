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
            let div = $('<div class="embed-responsive embed-responsive-21by9">')
            div.append($(mEl))
            $('.card-body').prepend(div)
            
            $('.container').append(row)
        }else{
            $('.card-body').append(mEl)
            let row = $('<div class="row">')
            let col = $('<div class="col-6">')
            let div = $('<div class="border border-dark py-4">')
            let slider = $('<input type="range" name="audioBit" class="border border-dark">')
            slider.change(function(){
                connection.setAudioBitrates($(this).val())
            })
            let label = $('<label for="audioBit">').html("Audio bitrate:")
            col.append(div.append(label).append(slider))
            row.append(col)
            $('.container').append(row)
            $('body').append(($('<button>').html('Mute').click(function(){
                connection.mute_audio()
            })))
        }
        let col = $('<div class="col-6">')
        let label = $('<label for="mics">').html("Select microfone:")
        let div = $('<div class="border border-dark">')
        let select_mics = $('<select name="mics" id="mic" class="form-control">').on('change', function(){
           connection.changeAudioTrack($(this).children(":selected").attr("id"))
        })
        let select_cams = $('<select id="cam" class="form-control">').on('change', function(){
            connection.changeVideoTrack($(this).children(":selected").attr("id"))
         })
        let mics = connection.getAudioDevices()
        let cameras = connection.getVideoDevices();
        for(let i=0;i < mics.length;i++){
            select_mics.append($(`<option id='${mics[i].deviceId}'>`).html(mics[i].label))
        }
        for(let i=0;i < cameras.length;i++){
            select_cams.append($(`<option id='${cameras[i].deviceId}'>`).html(cameras[i].label))
        }
        let row_2 = $('<div class="row">')
        row_2.append(col.append(div.append(label).append(select_mics)))
        $('.container').append(row_2)
    })
    connection.onBroadcaster((mEl, socket_id)=>{

        let col = $(`<div id=${socket_id} class="card border-dark col-${columnsOnMedia} pr-0 pl-0 mr-5 mb-5">`)
        col.append($('<h5 class="card-header white-text text-center py-4">').html("Streaming"))
        let card_body = $('<div class="card-body">')
        let div_cont
        if($(mEl).is('video')){
            let div = $('<div class="embed-responsive embed-responsive-21by9">')
            card_body.append(div)
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
            $(".w-100:last-child").remove();
        }
    })
}