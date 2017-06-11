"use strict";

var http = require("http");
var mongoose = require("mongoose");
var message_model = require("./schema/message");

var server = http.createServer(function (request, response) {

});
server.listen(6010);
var chat_io = require("socket.io").listen(server);

// 连接数据库
mongoose.connect("mongodb://shadowsocks:mlgR4evB@127.0.0.1:27017/vpn");

var clients = [];
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

    /**
     *  消息体格式
     *  message = {
     *      logic_id: "chat",
     *      username: "舒超",
     *      from    : from_user_id,
     *      target  : target_user_id,
     *      content : "消息内容",
     *      type    : "text"
     *  }
     */
    connection.on("message", function (message) {
        if (!validator(message)) {
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

        console.log((new Date()) + " message: " + JSON.stringify(message));

        switch (message.logic_id) {
            // 聊天
            case "chat":
                // 目标用户在线
                message.read = false;
                if (undefined != clients[message.target]) {
                    message.time = (new Date()).getTime();
                    clients[message.target].json.send(message);
                    connection.json.send({
                        logic_id: "send_success",
                        username: "系统消息",
                        from    : "system",
                        target  : message.from,
                        read    : false,
                        time    : (new Date()).getTime(),
                        content : "消息发送成功",
                        type    : "text"
                    });
                } else {
                    connection.json.send({
                        logic_id: "cache_success",
                        username: "系统消息",
                        from    : "system",
                        target  : message.from,
                        read    : false,
                        time    : (new Date()).getTime(),
                        content : "消息缓存成功",
                        type    : "text"
                    });
                }
                message.from = mongoose.Types.ObjectId(message.from);
                message.target = mongoose.Types.ObjectId(message.target);
                (new message_model(message)).save(function (err) {
                    if (err != null) {
                        console.log("保存消息失败: " + err);
                    }
                });
                break;
            // 登录
            case "login":
                if (message.from != undefined) {
                    clients[message.from] = connection;
                    connection.from = message.from;
                    connection.json.send({
                        logic_id: "login_success",
                        username: "系统消息",
                        from    : "system",
                        target  : message.from,
                        read    : false,
                        time    : (new Date()).getTime(),
                        content : "登录成功",
                        type    : "text"
                    });
                } else {
                    connection.json.send({
                        logic_id: "login_error",
                        username: "系统消息",
                        from    : "system",
                        target  : "",
                        read    : false,
                        time    : (new Date()).getTime(),
                        content : "登录失败",
                        type    : "text"
                    });
                }
                break;
            case "list":
                // todo 拉取消息列表
                break;
            case "read":
                // todo 置为已读
                break;
            // 异常情况
            default:
                connection.json.send({
                    logic_id: "logic_id_error",
                    username: "系统消息",
                    from    : "system",
                    target  : message.from,
                    read    : false,
                    time    : (new Date()).getTime(),
                    content : "logic_id错误",
                    type    : "text"
                });
        }
    });

    connection.on("disconnect", function (socket) {
        console.log("关闭链接: " + socket);
        if (clients[connection.from] != undefined) {
            delete clients[connection.from];
        }
    });
});

function validator(message) {
    if ("object" != typeof message || message.logic_id == undefined) {
        return false;
    }
    if (undefined == message.from || undefined == message.target) {
        return false;
    }
    return !(undefined == message.content || undefined == message.type);
}