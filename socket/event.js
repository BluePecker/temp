var mongoose = require("mongoose");
var crypto = require('crypto');
var session = require("../session/memory");
var message = require("../schema/message");
var config = require("../library/config").load("server.json");
var request = require("request");
var event_emitter = require("events").EventEmitter;

var event = new event_emitter();

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
    connection.send(JSON.stringify({
        logic_id: "login_success",
        username: "系统消息",
        from    : "system",
        target  : content.from,
        read    : false,
        content : "登录成功",
        type    : "text",
        time    : (new Date()).getTime()
    }));
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
        session.get(content.target).send(JSON.stringify(content));

        connection.send(JSON.stringify({
            logic_id: "send_success",
            username: "系统消息",
            from    : "system",
            target  : content.from,
            read    : false,
            time    : (new Date()).getTime(),
            type    : "text",
            content : content.content
        }));
    }

    var hash = crypto.createHash('md5');
    var str1 = content.from.substr(0, 1);
    var str2 = content.target.substr(0, 1);
    hash.update(str1 > str2 ? content.from + content.target : content.target + content.from);

    content.session_id = hash.digest("hex");

    (new message(content)).save(function (err) {
        if (err == null) {
            if (!session.alive(content.target)) {
                connection.send(JSON.stringify({
                    logic_id: "cache_success",
                    username: "系统消息",
                    from    : "system",
                    target  : content.from,
                    read    : false,
                    time    : (new Date()).getTime(),
                    type    : "text",
                    content : content.content
                }));
                request.post({
                    headers: {
                        'content-type': 'application/json'
                    },
                    url    : config.notice_server,
                    body   : JSON.stringify({
                        openId : content.target,
                        content: content.content
                    })
                }, function (error, response) {
                    if (error || response.statusCode !== 200) {
                        console.log('微信推送提醒失败: ' + JSON.stringify(content));
                        console.log(error);
                    }
                });
            }
        } else {
            connection.send(JSON.stringify({
                logic_id: "save_error",
                username: "系统消息",
                from    : "system",
                target  : content.from,
                read    : false,
                time    : (new Date()).getTime(),
                type    : "text",
                content : "消息保存失败"
            }));
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
                    from  : content.from,
                    target: content.content.from
                }, {
                    from  : content.content.from,
                    target: content.from
                }
            ]
        };

        if (undefined != content.content.message_id && content.content.message_id != null) {
            query._id = {
                $lt: content.content.message_id
            };
        }

        var limit = content.content.limit == undefined || content.content.limit <= 0 ? 15 : content.content.limit;
        message.find(query).limit(limit).sort("-_id").select("_id username from target content type created").exec(function (err, docs) {
            if (err != null) {
                connection.send(JSON.stringify({
                    logic_id: "history_error",
                    username: "系统消息",
                    from    : "system",
                    target  : content.from,
                    read    : false,
                    time    : (new Date()).getTime(),
                    content : "查询历史消息出错",
                    type    : "text"
                }));
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
            connection.send(JSON.stringify({
                logic_id: "history_success",
                username: "系统消息",
                from    : "system",
                target  : content.from,
                read    : false,
                time    : (new Date()).getTime(),
                content : list,
                type    : "array"
            }));
        });
    }
});

/**
 *  标记已读
 *  {
 *      logic_id: "read",
 *      username: "舒超",
 *      from    : "586b033825942d0c496b8152",
 *      target  : "586b06fe25942d0c496b81cc",
 *      content : "标记已读",
 *      type    : "text"
 *  }
 */
event.on("read", function (connection, content) {
    message.update({
        created: {
            $lte: new Date()
        },
        from   : content.target,
        target : content.from
    }, {
        read    : true,
        modified: new Date()
    }, {
        multi: true
    }, function (err, raw) {
        if (err == null) {
            connection.send(JSON.stringify({
                logic_id: "read_success",
                username: "系统消息",
                from    : "system",
                target  : content.from,
                read    : false,
                time    : (new Date()).getTime(),
                content : "成功将" + raw + "条消息置为已读",
                type    : "text"
            }));
        } else {
            connection.send(JSON.stringify({
                logic_id: "read_error",
                username: "系统消息",
                from    : "system",
                target  : content.from,
                read    : false,
                time    : (new Date()).getTime(),
                content : "标记已读失败",
                type    : "text"
            }));
        }
    });
});

/**
 *  拉取会话列表
 *  {
 *      logic_id: "session",
 *      username: "舒超",
 *      from    : "586b033825942d0c496b8152",
 *      target  : "system",
 *      content : {
 *          session_id: null,
 *          limit     : 15,
 *          read      : false
 *      },
 *      type    : "object"
 *  }
 */
event.on("session", function (connection, content) {
    var match = {
        from  : {
            $ne: "system"
        },
        target: {
            $ne: "system"
        }
    };
    var chat_id = null;

    if (!content.content.read) {
        match = {
            target: content.from,
            read  : content.content.read || false
        };
    } else {
        match = {
            $or: [
                {
                    from: content.from
                }, {
                    target: content.from,
                    read  : true
                }
            ]
        };
    }

    if (undefined != content.content.session_id) {
        chat_id = content.content.session_id;
        if (chat_id != null) {
            try {
                match.$gt = mongoose.Types.ObjectId(chat_id)
            } catch (err) {
                console.log(err);
            }
        }
    }

    message.aggregate([
        {
            $match: match
        }, {
            $group: {
                _id       : "$session_id",
                session_id: {
                    $last: "$_id"
                },
                from      : {
                    $last: "$from"
                },
                target    : {
                    $last: "$target"
                },
                type      : {
                    $last: "$type"
                },
                unread    : {
                    $sum: 1
                },
                username  : {
                    $last: "$username"
                },
                content   : {
                    $last: "$content"
                },
                created   : {
                    $last: "$created"
                }
            }
        }, {
            $sort: {
                created: -1
            }
        }, {
            $limit: content.content.limit || 15
        }
    ]).exec(function (err, docs) {
        if (err == null) {
            docs = JSON.parse(JSON.stringify(docs));
            connection.send(JSON.stringify({
                logic_id: "session_success",
                username: "系统消息",
                from    : "system",
                target  : content.from,
                read    : false,
                time    : (new Date()).getTime(),
                content : docs.map(function (item) {
                    content.content.read == true && (item.unread = 0);
                    item.created = (new Date(item.created)).getTime();
                    return item;
                }),
                type    : "array"
            }));
        } else {
            connection.send(JSON.stringify({
                logic_id: "session_error",
                username: "系统消息",
                from    : "system",
                target  : content.from,
                read    : false,
                time    : (new Date()).getTime(),
                content : "拉取会话列表失败",
                type    : "text"
            }));
        }
    });
});

module.exports = event;