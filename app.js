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
        "type"   : "system",
        "status" : 100,
        "message": {
            "time"   : (new Date()).getTime(),
            "read"   : false,
            "content": "连接成功"
        }
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
                "type"   : "system",
                "status" : -4000,
                "message": {
                    "time"   : (new Date()).getTime(),
                    "read"   : false,
                    "content": "非法的数据"
                }
            });
            return false;
        }

        console.log((new Date()) + " Message: " + JSON.stringify(message));

        switch (message.logic_id) {
            // 聊天
            case "chat":
                // 目标用户在线
                message.read = false;
                if (undefined != clients[message.target]) {
                    message.time = (new Date()).getTime();
                    clients[message.target].json.send(message);
                    connection.json.send({
                        "type"   : "system",
                        "status" : 200,
                        "message": {
                            "time"   : (new Date()).getTime(),
                            "read"   : false,
                            "content": "消息发送成功"
                        }
                    });
                } else {
                    connection.json.send({
                        "type"   : "system",
                        "status" : 201,
                        "message": {
                            "time"   : (new Date()).getTime(),
                            "read"   : false,
                            "content": "目标用户离线，消息缓存成功"
                        }
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
                }
                break;
            // 异常情况
            default:
                connection.json.send({
                    "type"   : "system",
                    "status" : -4001,
                    "message": {
                        "time"   : (new Date()).getTime(),
                        "read"   : false,
                        "content": "非法的logic_id"
                    }
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