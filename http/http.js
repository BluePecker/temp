var express = require("express");
var parser = require("body-parser");
var message = require("../schema/message");
var session = require("../session/memory");
var request = require("request");
var config = require("../library/config").load("server.json");

var http = express();

http.use(parser.json());
http.use(parser.urlencoded({
    extended: true
}));

http.post("/pay/notice", function (req, res) {
    var params = {
        message_id: req.body.message_id,
        notice    : req.body.notice
    };

    var notice_has_field = true;
    var notice_field = ['from', 'username', 'target', 'target_name', 'ext_info', 'type', 'content'];
    notice_field.forEach(function (item) {
        !params.notice.hasOwnProperty(item) && (notice_has_field = false);
    });

    if (notice_has_field) {
        var content = {
            logic_id   : "chat",
            from       : params.notice.from,
            username   : params.notice.username,
            target     : params.notice.target,
            target_name: params.notice.target_name,
            type       : params.notice.type,
            content    : params.notice.content,
            ext_info   : params.notice.ext_info
        };

        (new message(content).save(function (err) {
            if (!err) {
                (new message).update(params.message_id, {
                    $set: {
                        "modified"      : new Date(),
                        "content.status": "done"
                    }
                }, function (err) {
                    if (!err) {
                        if (session.alive(params.notice.target)) {
                            session.get(params.target).send(JSON.stringify(params.notice));
                        } else {
                            request.post({
                                headers: {
                                    'content-type': 'application/json'
                                },
                                url    : config.notice_server,
                                // todo send some params
                                body   : JSON.stringify({})
                            }, function (error, response) {
                                if (!error && response.statusCode === 200) {
                                    console.log('成功推送支付成功提醒至doctor-x-server');
                                } else {
                                    console.log('微信推送支付成功提醒失败: ' + JSON.stringify(content));
                                    console.log(error);
                                }
                            });
                        }
                    } else {
                        console.log(err);
                        res.send("NO");
                    }
                })
            } else {
                console.log(err);
                res.send("NO");
            }
        }));
    }
});

http.get("/push", function (req, res) {
    // todo send push
});

module.exports = http;