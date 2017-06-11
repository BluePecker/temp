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
            /**
             * 聊天
             *  {
             *      logic_id: "chat",
             *      username: "舒超",
             *      from    : "586b033825942d0c496b8152",
             *      target  : "586b06fe25942d0c496b81cc",
             *      content : "消息内容",
             *      type    : "text"
             *  }
             */
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
                        type    : "text",
                        content : "消息发送成功"
                    });
                }
                message.from = mongoose.Types.ObjectId(message.from);
                message.target = mongoose.Types.ObjectId(message.target);
                (new message_model(message)).save(function (err) {
                    if (err == null) {
                        if (undefined == clients[message.target]) {
                            connection.json.send({
                                logic_id: "cache_success",
                                username: "系统消息",
                                from    : "system",
                                target  : message.from,
                                read    : false,
                                time    : (new Date()).getTime(),
                                type    : "text",
                                content : "消息缓存成功"
                            });
                        }
                    } else {
                        connection.json.send({
                            logic_id: "save_error",
                            username: "系统消息",
                            from    : "system",
                            target  : message.from,
                            read    : false,
                            time    : (new Date()).getTime(),
                            type    : "text",
                            content : "消息保存失败"
                        });
                    }
                });
                break;
            /**
             *  登录
             *  {
             *      logic_id: "login",
             *      username: "舒超",
             *      from    : "586b033825942d0c496b8152",
             *      target  : "system",
             *      content : "用户登录",
             *      type    : "text"
             *  }
             */
            case "login":
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
                break;
            /**
             *  历史消息列表
             *  {
             *      logic_id: "list",
             *      username: "舒超",
             *      from    : "586b033825942d0c496b8152",
             *      target  : "system",
             *      content : {
             *          message_id: 593d5522d86b3d1016d52b36,
             *          limit     : 15,
             *          from      : 586b06fe25942d0c496b81cc
             *      },
             *      type    : "object"
             *  }
             */
            case "history":
                if (typeof message.content == "object" && undefined != message.content.from) {
                    try {
                        var query = {
                            $or: [
                                {
                                    from  : mongoose.Types.ObjectId(message.from),
                                    target: mongoose.Types.ObjectId(message.content.from)
                                }, {
                                    from  : mongoose.Types.ObjectId(message.content.from),
                                    target: mongoose.Types.ObjectId(message.from)
                                }
                            ]
                        };

                        if (undefined != message.content.message_id && message.content.message_id != null) {
                            query._id = {
                                $lt: mongoose.Types.ObjectId(message.content.message_id)
                            };
                        }

                        var limit = message.content.limit == undefined || message.content.limit <= 0 ? 15 : message.content.limit;
                        message_model.find(query).limit(limit).sort("-_id").select("_id username from target content type created").exec(function (err, docs) {
                            if (err != null) {
                                connection.json.send({
                                    logic_id: "history_error",
                                    username: "系统消息",
                                    from    : "system",
                                    target  : message.from,
                                    read    : false,
                                    time    : (new Date()).getTime(),
                                    content : "查询历史消息出错",
                                    type    : "text"
                                });
                                return false;
                            }
                            var list = [];
                            docs.forEach(function (msg) {
                                list.push({
                                    _id     : msg._id,
                                    username: msg.username,
                                    from    : msg.from,
                                    target  : msg.target,
                                    content : msg.content,
                                    type    : msg.type,
                                    time    : (new Date(msg.created)).getTime()
                                });
                            });
                            connection.json.send({
                                logic_id: "history_success",
                                username: "系统消息",
                                from    : "system",
                                target  : message.from,
                                read    : false,
                                time    : (new Date()).getTime(),
                                content : list,
                                type    : "array"
                            });
                        });
                    } catch (err) {
                        console.log("查看历史消息异常: " + err);
                    }
                }
                break;
            /**
             *  标记已读
             *  {
             *      logic_id: "read",
             *      username: "舒超",
             *      from    : "586b033825942d0c496b8152",
             *      target  : "system",
             *      content : "标记已读",
             *      type    : "text"
             *  }
             */
            case "read":
                try {
                    message_model.update({
                        created: {
                            $lte: new Date()
                        },
                        target : mongoose.Types.ObjectId(message.from)
                    }, {
                        read    : true,
                        modified: new Date()
                    }, {
                        multi: true
                    }, function (err, raw) {
                        if (err == null) {
                            connection.json.send({
                                logic_id: "read_success",
                                username: "系统消息",
                                from    : "system",
                                target  : message.from,
                                read    : false,
                                time    : (new Date()).getTime(),
                                content : "成功将" + raw + "条消息置为已读",
                                type    : "text"
                            });
                        } else {
                            connection.json.send({
                                logic_id: "read_error",
                                username: "系统消息",
                                from    : "system",
                                target  : message.from,
                                read    : false,
                                time    : (new Date()).getTime(),
                                content : "标记已读失败",
                                type    : "text"
                            });
                        }
                    });
                } catch (err) {
                    console.log("标记已读异常: " + err);
                }
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