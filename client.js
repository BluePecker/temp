var socket = require('socket.io-client')('http://127.0.0.1:6010');
socket.on('connect', function () {

    console.log("connect");
    socket.emit('message', {
        logic_id: "chat",
        username: "舒超",
        from    : "586b033825942d0c496b8152",
        target  : "586b06fe25942d0c496b81cc",
        content : "消息内容",
        type    : "text"
    });

});

socket.on('event', function (data) {
    console.log("event" + data);
});
socket.on('disconnect', function () {
    console.log("disconnect");
});