import Broadcaster from './Broadcaster.js'
let connection = null 
window.Broadcaster = Broadcaster;
window.onload = ()=>{
    var SIGNALING_SERVER = "http://localhost";
    connection = new Broadcaster("http://localhost", io() ,null,window.id)
    connection.subscribeTo(window.channel, (mEl)=>{
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
    connection.onBroadcaster((mEl)=>{
        let card_border = $(`<div class="card border-dark">`)
        let card_header = $('<h5 class="card-header white-text text-center py-4">').html("Streaming")
        let card_body = $('<div class="card-body text-center px-lg-10 pt-0">')
        let col = $('<div class="col-6 pr-0">')
        if($(mEl).is('video')){
            let div = $('<div class="embed-responsive embed-responsive-21by9">')
            card_body.append(div)
        }else{
            card_body.append($(mEl))
        }
        card_border.append(card_header)
        card_border.append(card_body)
        col.append(card_border)
        $('.row:nth-child(1)').append(col)
    })
}