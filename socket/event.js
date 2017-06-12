var session = require("../session/memory");
var EventEmitter = require("events").EventEmitter;

var event = new EventEmitter();

event.on("login", function (connection, content) {
    session.add(content.from, connection);
    connection.from = content.from;
    connection.json.send({
        logic_id: "login_success",
        username: "系统消息",
        from    : "system",
        target  : content.from,
        read    : false,
        time    : (new Date()).getTime(),
        content : "登录成功",
        type    : "text"
    });
});

module.exports = event;