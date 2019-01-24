import Viewer from './Viewer.js'
let connection = null;

window.onload = ()=>{
    connection = new Viewer("http://localhost",io(),id)
    
    connection.subscribeTo(window.channel, ()=>{
        console.log('Connected')
    })
    connection.onBroadcaster((mEl)=>{
        if($(mEl).is('video')){
            let div = $('<div class="embed-responsive embed-responsive-21by9">')
            div.append($(mEl))
            $('.card-body').prepend(div)
        }else{
            $('.card-body').append(mEl)
        }
    })
}