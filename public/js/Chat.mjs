export default class Chat{
    constructor(socket){
        this.socket = socket
        this.socket.on('recieveMessage', this.reciveHandler)
        this.chatInstance = $('<div class="position-absolute" style="bottom: 20px; width: 80%;">')

        this.input = $('<input class="form-control" type="text">')
        this.chatInstance.append(this.input)
        this.chatInstance
            .append($('<button class="btn btn-outline-success ">').click(()=> this.sendMessage()).html('Send Message'))
    }
    getChatInstance(){
        return this.chatInstance;
    }
    reciveHandler(data){
        let msgContainer = $('<div class="chat">')
        let msg = $('<p>').html( data.msg)
        let span = $('<span class="time-left">').html(data.username + ", " +data.time)
        msgContainer
            .append(msg)
            .append(span)
        $('.scroll').append(msgContainer)
        $('.scroll').scrollTop($('.scroll').height())  
    }
    sendMessage(event){
       if(this.input.val() != ""){
            let username = window.username? window.username: "Anonymous"
            this.input.val(this.input.val().replace(/</g, "&lt;").replace(/>/g, "&gt;"))
            let msgContainer = $('<div class="chat darker" style="word-break:break-all;">')
            
            let msg = $('<p>').html(this.input.val())
            let d = new Date();
            let time = d.getHours() + ':' + d.getMinutes()
            let span = $('<span class="time-left">').html(username +", "+ time)
            msgContainer
               .append(msg)
               .append(span)
            $('.scroll').append(msgContainer)
            $('.scroll').scrollTop($('.scroll').height())  
           this.socket.emit("sendMessage", {msg: this.input.val(), time: time, username: username})
           this.input.val("")
        }
    }
}
