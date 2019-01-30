export default class Chat{
    constructor(socket){
        this.socket = socket
        this.socket.on('recieveMessage', this.reciveHandler)
        this.chatInstance = $('<div class="position-absolute" style="bottom: 20px; width: 90%;">')
        this.chatInstance
            .append($('<button class="btn btn-outline-success mb-2">').click(()=> this.sendMessage()).html('Send Message'))
        this.input = $('<input class="form-control" type="text">')
        this.chatInstance.append(this.input)
    }
    getChatInstance(){
        return this.chatInstance;
    }
    reciveHandler(data){
        let msgContainer = $('<div class="chat">')
        let msg = $('<p>').html(data.msg)
        let span = $('<span class="time-left">').html(data.time)
        msgContainer
            .append(msg)
            .append(span)
        $('.big-container').append(msgContainer)
    }
    sendMessage(event){
       if(this.input.val() != ""){
            let msgContainer = $('<div class="chat darker">')
            let msg = $('<p>').html(this.input.val())
            let d = new Date();
            let time = d.getHours() + ':' + d.getMinutes()
            let span = $('<span class="time-left">').html(time)
            msgContainer
               .append(msg)
               .append(span)
            $('.big-container').append(msgContainer)
           this.socket.emit("sendMessage", {msg: this.input.val(), time: time})
        }
    }
}
