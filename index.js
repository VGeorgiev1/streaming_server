var express = require("express");
var app = new express();
 
var port = process.env.port || 3000; 
var server = app.listen(port, () => console.log(`Example app listening on port ${port}!`))
var io = require('socket.io').listen(server);

app.use(express.static(__dirname + "/public" ));
 
app.get('/',function(req,res){
    res.redirect('index.html');
}); 
io.on('connection',function(socket){
    console.log("connected")
    socket.on('stream',function(image){
        socket.emit('stream',image);  
    });
});