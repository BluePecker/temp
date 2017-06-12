var session = require("../session/memory");
var mongoose = require("mongoose");
var message = require("../schema/message");
var event_emitter = require("events").EventEmitter;

var event = new event_emitter();
function str_to_obj(str) {
    try {
        return mongoose.Types.ObjectId(str);
    } catch (err) {
        console.log(err);
        return null;
    }
}

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
event.on("login", function (connection, content) {
    session.add(content.from, connection);
    connection.from = content.from;
    connection.send({
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
event.on("chat", function (connection, content) {
    // 目标用户在线
    content.read = false;
    if (session.alive(content.target)) {
        content.time = (new Date()).getTime();
        session.get(content.target).send(content);

        connection.send({
            logic_id: "send_success",
            username: "系统消息",
            from    : "system",
            target  : content.from,
            read    : false,
            time    : (new Date()).getTime(),
            type    : "text",
            content : "消息发送成功"
        });
    }
    content.from = str_to_obj(content.from);
    content.target = str_to_obj(content.target);
    (new message(content)).save(function (err) {
        if (err == null) {
            if (!session.alive(content.target)) {
                connection.send({
                    logic_id: "cache_success",
                    username: "系统消息",
                    from    : "system",
                    target  : content.from,
                    read    : false,
                    time    : (new Date()).getTime(),
                    type    : "text",
                    content : "消息缓存成功"
                });
            }
        } else {
            connection.send({
                logic_id: "save_error",
                username: "系统消息",
                from    : "system",
                target  : content.from,
                read    : false,
                time    : (new Date()).getTime(),
                type    : "text",
                content : "消息保存失败"
            });
        }
    });
});

/**
 *  历史消息列表
 *  {
 *      logic_id: "history",
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
event.on("history", function (connection, content) {
    if (typeof content.content == "object" && undefined != content.content.from) {
        var query = {
            $or: [
                {
                    from  : str_to_obj(content.from),
                    target: str_to_obj(content.content.from)
                }, {
                    from  : str_to_obj(content.content.from),
                    target: str_to_obj(content.from)
                }
            ]
        };

        if (undefined != content.content.message_id && content.content.message_id != null) {
            query._id = {
                $lt: str_to_obj(content.content.message_id)
            };
        }

        var limit = content.content.limit == undefined || content.content.limit <= 0 ? 15 : content.content.limit;
        message.find(query).limit(limit).sort("-_id").select("_id username from target content type created").exec(function (err, docs) {
            if (err != null) {
                connection.send({
                    logic_id: "history_error",
                    username: "系统消息",
                    from    : "system",
                    target  : content.from,
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
            connection.send({
                logic_id: "history_success",
                username: "系统消息",
                from    : "system",
                target  : content.from,
                read    : false,
                time    : (new Date()).getTime(),
                content : list,
                type    : "array"
            });
        });
    }
});

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
event.on("read", function (connection, content) {
    message.update({
        created: {
            $lte: new Date()
        },
        target : str_to_obj(content.from)
    }, {
        read    : true,
        modified: new Date()
    }, {
        multi: true
    }, function (err, raw) {
        if (err == null) {
            connection.send({
                logic_id: "read_success",
                username: "系统消息",
                from    : "system",
                target  : content.from,
                read    : false,
                time    : (new Date()).getTime(),
                content : "成功将" + raw + "条消息置为已读",
                type    : "text"
            });
        } else {
            connection.send({
                logic_id: "read_error",
                username: "系统消息",
                from    : "system",
                target  : content.from,
                read    : false,
                time    : (new Date()).getTime(),
                content : "标记已读失败",
                type    : "text"
            });
        }
    });
});

module.exports = event;