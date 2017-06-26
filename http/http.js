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
        notice    : req.body
    };

    var notice_has_field = true;
    var notice_field = ['from', 'username', 'target', 'target_name', 'ext_info', 'type', 'content'];
    notice_field.forEach(function (item) {
        (!params.notice || !params.notice.hasOwnProperty(item)) && (notice_has_field = false);
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
            ext_info   : !params.notice.ext_info ? {} : params.notice.ext_info
        };
        content.ext_info.message_id = params.message_id;

        console.log(content);

        (new message(content).save(function (err) {
            if (!err) {
                message.update({
                    _id: params.message_id
                }, {
                    $set: {
                        "modified"      : new Date(),
                        "content.status": "done"
                    }
                }, function (err) {
                    if (!err) {
                        if (session.alive(params.notice.target)) {
                            var connection = session.get(params.notice.target);
                            connection != undefined && connection.send(JSON.stringify(params.notice));
                            res.send("OK");
                        } else {
                            request.post({
                                headers: {
                                    'content-type': 'application/json'
                                },
                                url    : config.doctor_x_api + "/wechat/msgNotice",
                                body   : JSON.stringify({
                                    mpOpenId : content.ext_info.mpOpenId || '',
                                    xcxOpenId: content.target,
                                    content  : content.content || '',
                                    wxUnionID: content.ext_info.wxUnionID || ''
                                })
                            }, function (error, response) {
                                if (!error && response.statusCode === 200) {
                                    console.log('成功推送支付成功提醒至doctor-x-server');
                                    res.send("YES");
                                } else {
                                    console.log('微信推送支付成功提醒失败: ' + JSON.stringify(content));
                                    console.log(error);
                                    res.send("NO");
                                }
                            });
                        }
                    } else {
                        console.log("更新支付记录失败");
                        console.log(err);
                        res.send("NO");
                    }
                })
            } else {
                console.log("保存付款通知消息失败");
                console.log(err);
                res.send("NO");
            }
        }));
    } else {
        res.send("NO");
    }
});

http.get("/push", function (req, res) {
    // todo send push
});

module.exports = http;