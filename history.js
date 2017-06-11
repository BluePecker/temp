var socket = require('socket.io-client')('http://127.0.0.1:6010');
socket.on('connect', function () {
    socket.emit('message', {
        logic_id: "login",
        username: "舒超",
        from    : "586b033825942d0c496b8152",
        target  : "system",
        content : "用户登录",
        type    : "text"
    });

    socket.emit('message', {
        logic_id: "list",
        username: "舒超",
        from    : "586b033825942d0c496b8152",
        target  : "system",
        content : {
            limit: 10,
            from : "586b06fe25942d0c496b81cc"
        },
        type    : "object"
    });
});

socket.on('message', function (message) {
    console.log(JSON.stringify(message));
});

socket.on('disconnect', function () {
    console.log("disconnect");
});