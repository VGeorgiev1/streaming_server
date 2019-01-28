export default class Player{
    
    constructor(options, columns){
        this.columns = columns
        this.media = options.media;
        if(!options.socket_id){
            this.col = $(`<div class="card border-dark col-${this.columns} pr-0 pl-0 mr-5 mb-5">`)
            
        }else{
            this.id = options.socket_id;
            this.col = $(`<div id=${this.id} class="card border-dark col-${this.columns} pr-0 pl-0 mr-5 mb-5">`)
        }
        this.reso = options.reso
        this.body =  $('<div class="card-body">')
        this.constrains = options.constrains;
        this.col.append($('<h5 class="card-header white-text text-center py-4">').html("steaming"))
    }
    getPlayer(){
        
        if(this.constrains.video){
            return this.getVideoPlayer()
        }else{
            return this.getAudioPlayer()
        }
        
    }
    isElement(){
        return this.media instanceof HTMLElement;
    }
    getVideoPlayer(){
        if(!this.isElement()){
            return this.col.append(this.getVideoContext(this.media.getMediaElement()))
                    .append(this.getAudioBitrateControl())
                    .append(this.getVideoBitrateControl())
        }
        return this.col.append(this.getVideoContext(this.media))
    }
    getAudioPlayer(){
        if(!this.isElement()){
            return this.col.append(this.getAudioContext(this.media.getMediaElement()))
                .append(this.getAudioBitrateControl())
                .append(this.getAudioInputsControl()) 
        }
        return this.col.append(this.getAudioContext(this.media))
    }
    getAudioContext(media){
        let div_cont = $('<div class="text-center embed-responsive-item" mb-2">')
        div_cont.append($(media).attr("style", "width:60%"));
        return div_cont
    }
    getVideoContext(media){
        console.log('what')
        let div_cont = $(`<div class="embed-responsive embed-responsive-${this.reso}">`)
        div_cont.append($(media))
        return div_cont
    }
    getAudioMuteControl(){
        $('<button>').html('Mute').click(()=>{
            this.media.mute_audio()
        })
    }
    getAudioBitrateControl(){
        let div_audio = $('<div class="border border-dark py-4">')
        let slider_audio = $('<input type="range" min="8" max="50" name="audioBit" class="border border-dark">')
        slider_audio.change(()=>{
            this.media.setAudioBitrates(slider_audio.val())
        })
        let label_audio = $('<label for="audioBit">').html("Audio bitrate:")
        div_audio.append(label_audio).append(slider_audio)
        return div_audio;
    }
    getVideoBitrateControl(){
        let div_video = $('<div class="border border-dark py-4">')
        let slider_video = $('<input type="range" min="50" max="2000" name="videoBit" class="border border-dark">')
        slider_video.change(()=>{
            console.log(slider_video.val())
            this.media.setVideoBitrates(slider_video.val())
        })
        let label_video = $('<label for="videoBit">').html("Video bitrate:")
        return div_video.append(label_video).append(slider_video);
    }
    getAudioInputsControl(){
        let mics = this.media.getAudioDevices()
        let div = $('<div class="border border-dark">')

        if(mics.length != 0){
            let label_mic = $('<label for="mics">').html("Select microfone:")
            let select_mics = $('<select name="mics" id="mic" class="form-control">').on('change', ()=>{
                this.media.changeAudioTrack($(select_mics).children(":selected").attr("id"))
            })
            for(let i=0;i < mics.length;i++){
                select_mics.append($(`<option id='${mics[i].deviceId}'>`).html(mics[i].label))
            }
            div.append(label_mic).append(select_mics)
        }
        return div;
    }
    getVideoInputsControl(){
        let cameras = this.media.getVideoDevices();
        let div = $('<div class="border border-dark">')
        if(cameras.length != 0){
            let label_cam = $('<label for="cams">').html("Select camera:")
            let select_cams = $('<select id="cams" class="form-control">').on('change', ()=>{
                this.media.changeVideoTrack($(this).children(":selected").attr("id"))
            })
            for(let i=0;i < cameras.length;i++){
                select_cams.append($(`<option id='${cameras[i].deviceId}'>`).html(cameras[i].label))
            }
            div.append(label_cam).append(select_cams)
        }
        return div;
    }

}