export default class Player{
    
    constructor(options, columns){
        this.columns = columns
        this.media = options.media;
        this.options = options
        this.reso = options.reso
        this.iselement = this.isElement()
        console.log(options.constrains)
        this.constrains = options.constrains
        if(!this.iselement){
            this.media.onMediaNegotion(()=>{
                console.log(this.media.getConstrains())
                this.negotiatePlayer(this.media.getConstrains(), this.media);
            })
            this.media.onChannelLeft(()=>{
                this.col.remove();
            })
        }
        
        this.body =  $('<div class="card-body">')
        
    }
    addStream(mEl){
        if($(mEl).is('video')){
            this.body.prepend(this.getVideoContext(mEl))

        }else{
            this.body.append(this.getAudioContext(mEl))
        }
    }
    negotiatePlayer(constrains,mEl){
        this.constrains = constrains
        this.media = mEl;
        this.changeContext() 
        
        console.log('negotate')
    }
    removePlayer(){
        this.body.remove();
    }
    changeContext(){
        this.constrains.video ?
            $(`#${this.id}`).replaceWith(this.getVideoPlayer()) :  $(`#${this.id}`).replaceWith(this.getAudioPlayer())
    }
    buildBase(){
        if(!this.options.socket_id){
            this.id = 'local'
        }else{
            this.id = this.options.socket_id.replace('#', '1').replace('/','2');
        }
        this.col = $(`<div id = ${this.id} class="card border-dark col-${this.columns} pr-0 pl-0 mr-5 mb-5">`)
        this.col.append($('<h5 class="card-header white-text text-center py-4">').html("steaming"))
    }
    getPlayer(){
        return this.constrains.video ? this.getVideoPlayer() : this.getAudioPlayer()
    }
    isElement(){
        return this.media instanceof HTMLElement;
    }
    getVideoPlayer(){
        this.buildBase();
        this.body.empty();
        if(!this.iselement){
            return this.col.append(this.body
                    .append(this.getVideoContext())
                    .append(this.getAudioBitrateControl())
                    .append(this.getAudioMuteControl())
                    .append(this.getVideoMuteControl())
                    .append(this.getVideoBitrateControl())
                    .append(this.getAudioInputsControl())
                    .append(this.getVideoInputsControl()))
        }
        return this.col.append(this.body.append(this.getVideoContext()))
    }
    getAudioPlayer(){
        if(this.col){
            this.col.empty();
        }
        this.buildBase();
        this.body.empty();
        if(!this.iselement){
            this.col.append(this.body
                .append(this.getAudioContext())
                .append(this.getAudioBitrateControl())
                .append(this.getAudioInputsControl()))
                .append(this.getAudioMuteControl())
                if(this.media.hasVideo()){
                this.col.append(this.getVideoMuteControl());
            }
            console.log(this.col)
            return this.col

        }
        return this.col.append(this.body.append(this.getAudioContext()))
    }

    getAudioContext(media){
        let div_cont = $(`<div id=${this.id} class="text-center embed-responsive embed-responsive-item" mb-2">`)
        if(media){
            div_cont.append(this.iselement ? $(media).attr("style", "width:80%"):  $(media.getMediaElement()).attr("style", "width:80%"));

        }else{
            div_cont.append(this.iselement ? $(this.media).attr("style", "width:80%"):  $(this.media.getMediaElement()).attr("style", "width:80%"));
        }
        return div_cont
    }
    getVideoContext(media){
        
        let div_cont = $(`<div id=${this.id} class="embed-responsive embed-responsive-${this.reso}", style="position: relative;">`)
        if(media){
            div_cont.append(this.iselement ? $(media): $(media.getMediaElement()))

        }else{
            div_cont.append(this.iselement ? $(this.media): $(this.media.getMediaElement()))

        }
        return div_cont
    }
    getAudioMuteControl(){
        if(this.media.hasActiveAudio() || this.media.hasMutedAudio()){
            
            if(!this.media.hasMutedAudio()){
                return $('<button id="audio_mute" class="btn btn-danger">').html('Mute').click(()=>{
                    this.muteAudio()  
                })
            }

            return $('<button id="audio_mute" class="btn btn-success">').html('Unmute').click(()=>{
                this.muteAudio()  
            })
            // return $('<button id="audio_mute" class="btn btn-danger">').html('Mute').click(()=>{
            //     this.media.hasMutedAudio()?
            //         ($('#audio_mute').html('Umute').removeClass('btn-danger').addClass('btn-success'),
            //         this.media.muteAudio())
            //     :
            //         ($('#audio_mute').html('Mute').removeClass('btn-success').addClass('btn-danger'),
            //         this.media.muteAudio())
            // })
        }
    }
    getVideoMuteControl(){
        if(this.media.hasActiveVideo() || this.media.hasMutedVideo() || this.media.hasVideo()){
            return $('<button class="btn btn-success" id="video_mute">').html('Start Video').click(()=>{
                $('#video_mute').html() == 'Start Video' ?
                    ($('#video_mute').html('Stop Video'),
                    $('#video_mute').removeClass('btn-success').addClass('btn-danger'),
                    this.body.append(this.getVideoInputsControl()).append(this.getVideoBitrateControl()),
                    this.media.hasActiveVideo()?this.media.muteVideo():this.media.requestVideo())
                :
                    ($('#video_mute').html('Start Video'),
                    $('#video_mute').removeClass('btn-danger').addClass('btn-success'),
                    $('#video_input').remove(),
                    $('#video_bitrate').remove(),
                    this.media.muteVideo())
            })
        }
    }
    getAudioBitrateControl(){
        if(this.media.hasActiveAudio()){
            console.log('not true')
            if( !$('#audio_bitrate').length ){
                let div_audio = $('<div id="audio_bitrate" class="border border-dark py-4">')
                let slider_audio = $('<input type="range" min="8" max="50" name="audioBit" class="border border-dark">')
                slider_audio.change(()=>{
                    this.media.setAudioBitrates(slider_audio.val())
                })
                let label_audio = $('<label for="audioBit">').html("Audio bitrate:")
                div_audio.append(label_audio).append(slider_audio)
                return div_audio;
            }
        }
    }
    getVideoBitrateControl(){
        if(this.media.hasActiveVideo()){
            if( !$('#video_bitrate').length ){
                let div_video = $('<div id="video_bitrate" class="border border-dark py-4">')
                let slider_video = $('<input type="range" min="10" max="2000" name="videoBit" class="border border-dark">')
                slider_video.change(()=>{
                    this.media.setVideoBitrates(slider_video.val())
                })
                let label_video = $('<label for="videoBit">').html("Video bitrate:")
            
                return div_video.append(label_video).append(slider_video);
            }
        }
    }
    getAudioInputsControl(){
        if(this.media.hasActiveAudio()){
            let mics = this.media.getAudioDevices()
            let div = $('<div class="border border-dark">')

            if(mics.length != 0){
                let label_mic = $('<label for="mics">').html("Select microphone:")
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
    }
    getVideoInputsControl(){
        if(this.media.hasActiveVideo()){
            let cameras = this.media.getVideoDevices();
            let div = $('<div id="video_input" class="border border-dark">')
            if(cameras.length != 0){
                let label_cam = $('<label for="cams">').html("Select camera:")
                let select_cams = $('<select id="cams" class="form-control">').on('change', ()=>{
                    this.media.changeVideoTrack($(select_cams).children(":selected").attr("id"))
                })
                select_cams.append($('<option disabled selected value>').html('Select an cam'))      
                for(let i=0;i < cameras.length;i++){
                    select_cams.append($(`<option id='${cameras[i].deviceId}'>`).html(cameras[i].label))
                }
                div.append(label_cam).append(select_cams)
                
            }
            return div;
        }
    }

}