"use strict";

var http = require("http");
var mongoose = require("mongoose");
var message_schema = require("./schema/message");
var message_model = mongoose.model("message", message_schema);

var server = http.createServer(function (request, response) {

});
server.listen(6010);

var clients = [];
var chat_io = require("socket.io").listen(server);

try {
    // 连接数据库
    mongoose.connect("mongodb://shadowsocks:mlgR4evB@127.0.0.1:27017/vpn");
} catch (e) {
    console.log(e);
}

chat_io.on("connection", function (connection) {
    console.log((new Date()) + ' connection from origin ' + connection.id + '.');

    connection.json.send({
        logic_id: "conn",
        message : "连接成功"
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
        switch (message.logic_id) {
            // 聊天
            case "chat":
                message.time = (new Date()).getTime();
                // 目标用户在线
                if (undefined != clients[message.target]) {
                    clients[message.target].json.send(message);
                    message.from = mongoose.Types.ObjectId(message.from);
                    message.read = true;
                    message.target = mongoose.Types.ObjectId(message.target);
                    (new message_model(message)).save(function (err) {
                        if (err != null) {
                            console.log("保存消息失败: " + err);
                        }
                    });
                } else { // 目标用户离线
                    message.from = mongoose.Types.ObjectId(message.from);
                    message.target = mongoose.Types.ObjectId(message.target);
                    (new message_model(message)).save(function (err) {
                        if (err != null) {
                            console.log("保存消息失败: " + err);
                        }
                    });
                }
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