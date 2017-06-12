"use strict";

var http = require("./http/http");
var event = require("./socket/event");
var mongoose = require("mongoose");
var session = require("./session/memory");

// 连接数据库
mongoose.connect("mongodb://rdoctor:362bc188@db.pro.com:27017/HuaXi");
var server = http.listen(6010, function () {
    console.log("listening port: " + server.address().port);
});
var chat_io = require("socket.io").listen(server);

chat_io.on("connection", function (connection) {

    console.log((new Date()) + ' connection from origin ' + connection.id);
    connection.json.send({
        logic_id: "conn_success",
        username: "系统消息",
        from    : "system",
        target  : "",
        read    : false,
        time    : (new Date()).getTime(),
        content : "连接成功",
        type    : "text"
    });

    connection.on("message", function (content) {
        if (!validator(content)) {
            connection.json.send({
                logic_id: "msg_error",
                username: "系统消息",
                from    : "system",
                target  : "",
                read    : false,
                time    : (new Date()).getTime(),
                content : "消息格式错误",
                type    : "text"
            });
            return false;
        }
        console.log((new Date()) + " message: " + JSON.stringify(content));
        event.emit(content.logic_id, connection, content);
    });

    connection.on("disconnect", function (socket) {
        console.log("关闭链接: " + socket);
        session.del(connection.name);
    });
});

function validator(content) {
    if ("object" != typeof content || content.logic_id == undefined) {
        return false;
    }
    if (undefined == content.from || undefined == content.target) {
        return false;
    }
    return !(undefined == content.content || undefined == content.type);
}