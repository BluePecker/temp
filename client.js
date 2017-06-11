var socket = require('socket.io-client')('http://127.0.0.1:6010');
socket.on('connect', function () {

    console.log("connect");
    socket.emit('message', {
        name: "舒超"
    });

});

socket.on('event', function (data) {
    console.log("event" + data);
});
socket.on('disconnect', function () {
    console.log("disconnect");
});