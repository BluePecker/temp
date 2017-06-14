"use strict";

var http = require("./http/http");
var event = require("./socket/event");
var mongoose = require("mongoose");
var session = require("./session/memory");
var config = require("./library/config").load('server.json');

// 连接数据库
mongoose.connect(config.db_connect);
var server = http.listen(config.port, function () {
    console.log("listening port: " + server.address().port);
});
var web_socket = require('ws');
var wss = new web_socket.Server({server: server});

wss.on("connection", function (connection) {
    connection.send(JSON.stringify({
        logic_id: "conn_success",
        username: "系统消息",
        from    : "system",
        target  : "",
        read    : false,
        time    : (new Date()).getTime(),
        content : "连接成功",
        type    : "text"
    }));

    connection.on("message", function (content) {
        try {
            content = JSON.parse(content);
        } catch (err) {
            console.log(err)
        }
        if (!validator(content)) {
            connection.send(JSON.stringify({
                logic_id: "msg_error",
                username: "系统消息",
                from    : "system",
                target  : "",
                read    : false,
                time    : (new Date()).getTime(),
                content : "消息格式错误",
                type    : "text"
            }));
            return false;
        }
        console.log((new Date()) + " message: " + JSON.stringify(content));
        event.emit(content.logic_id, connection, content);
    });

    connection.on("close", function (socket) {
        console.log("关闭链接: " + socket + " " + connection.from);
        session.del(connection.from);
    });
});

function validator(content) {
    if ("object" != typeof content || content.logic_id == undefined) {
        return false;
    }
    if (undefined == content.from || undefined == content.target) {
        return false;
    }
    if (!content.from.length || !content.target.length) {
        return false;
    }
    return !(undefined == content.content || undefined == content.type);
}