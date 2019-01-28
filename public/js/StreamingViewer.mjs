import Viewer from './Viewer.js'
let connection = null;

window.onload = ()=>{
    connection = new Viewer("http://localhost",io(),id)
    
    connection.subscribeTo(window.channel, ()=>{
        console.log('Connected')
    })
    connection.onBroadcaster((mEl)=>{
        if($(mEl).is('video')){
            console.log('ok?')
            let div = $('<div class="embed-responsive embed-responsive-16by9">')
            div.append($(mEl))
            let header = $('<h5 class="card-header white-text text-center py-4">').html("Streaming");

            let row = $('<div class="row">')
            let col = $('<div class="card border-dark col-12 pr-0 pl-0 mr-5 mb-5">')
            let card_body = $('<div class="card-body">')
            let div_cont = $('<div class="border border-dark py-4">')
            col.append(header)
            row.append(col.append(card_body.append(div_cont.append(div))))
            $('.container').append(row)
        }else{
            $('.card-body').append(mEl)
        }
    })
}