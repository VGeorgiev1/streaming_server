function sendRequest(id){
    makeRequest("/sendrequest", "POST", JSON.stringify({'id': id}), "application/json; charset=utf-8")
        .then((res)=>{
            $('#'+id).html(`<button class="btn btn-danger mb-2" onclick="removeFriend(${id})">Cancel Request</button>`)
        })
        .catch(e=>{
            console.log(e)
        })
}
function makeRequest(url, method, data, contentTyppe){
    return $.ajax({
        url:url,
        method: method,
        contentType: contentTyppe,
        data: data
    })
}
function acceptRequest(id){
    makeRequest("/accept", "POST", JSON.stringify({id:id}), "application/json; charset=utf-8")
        .then((res)=>{
            console.log($('#'+id))
            $('#'+id).html(`<button class="btn btn-danger mb-2" onclick="removeFriend(${id})">Remove Friend</button>`)         
        }).catch((e)=>{
            console.log(e)
        })
}
function removeFriend(id){
    makeRequest("/remove", "POST", JSON.stringify({id:id}), "application/json; charset=utf-8")
        .then((res)=>{
            $('#'+id).html(`<button class="btn btn-outline-success mb-2" onclick="sendRequest(${id})">Send Request</button>`)
        })
}
function search(){
    let username = $('#searchbox').val()
    
    if(username!= ''){
        makeRequest("/search", "POST",JSON.stringify({'username': username}), "application/json; charset=utf-8")
            .then((res)=>{
                $('.cards').empty()
                res.forEach(row => {
                    let deck = $("<div class='card-deck'>");
                    
                    row.forEach(user=>{
                        let card = $('<div class="card border-dark mb-3" style="max-width: 20rem;">')
                        let header = $('<p class="card-header">').html(user.username)
                        let card_body = $('<div class="card-body text-dark">')

                        let cont = $(`<div id=${user.id}>`)
                        switch(user.status){
                            case 'invite':
                                cont.append($(`<button class="btn btn-danger mb-2"  onclick="removeFriend(${user.id})">`).html("Cancel Request"))
                                break;
                            case 'request':
                                cont.append($(`<button class="btn btn-outline-success mb-2"  onclick="acceptRequest(${user.id})">`).html("Accept Request"))
                                cont.append($(`<button class="btn btn-danger mb-2"  onclick="removeFriend(${user.id})">`).html("Decline Request"))                      
                                break;
                            case 'not_affiliated':
                                cont.append($(`<button class="btn btn-outline-success mb-2"  onclick="sendRequest(${user.id})">`).html("Send Request"))
                                break;
                            case 'friends':
                                cont.append($(`<button class="btn btn-danger mb-2"  onclick="removeFriend(${user.id})">`).html("Remove Friend"))                           
                                break;
                        }
                        card.append(header)
                        card_body.append(cont)
                        card.append(card_body)
                        deck.append(card)
                    })
                    $('.cards').append(deck)
                })
            }).catch(e=>{
                console.log(e)
            })
    }
}