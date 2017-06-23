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

http.get("/push", function (req, res) {
    var params = req.body;

    var check_property = true;
    var property = ['from', 'username', 'target', 'target_name', 'ext_info', 'type', 'content'];
    property.forEach(function (item) {
        !params.hasOwnProperty(item) && (check_property = false);
    });

    if (check_property) {
        var content = {
            logic_id   : "chat",
            username   : params.username,
            from       : params.from,
            target     : params.target,
            target_name: params.target_name,
            content    : params.content,
            type       : params.type,
            ext_info   : params.ext_info
        };

        (new message(content)).save(function (err) {
            if (err == null) {
                // todo 根据消息类型去更新历史支付记录
                if (session.alive(params.target)) {
                    session.get(params.target).send(JSON.stringify(content));
                } else {
                    request.post({
                        headers: {
                            'content-type': 'application/json'
                        },
                        url    : config.notice_server,
                        body   : JSON.stringify({
                            mpOpenId : content.ext_info.mpOpenId || '',
                            xcxOpenId: content.target,
                            type     : content.type,
                            content  : content.content || '',
                            wxUnionID: content.ext_info.wxUnionID || ''
                        })
                    }, function (error, response) {
                        if (!error && response.statusCode === 200) {
                            console.log('成功推送微信提醒至doctor-x-server');
                        } else {
                            console.log('微信推送提醒失败: ' + JSON.stringify(content));
                            console.log(error);
                        }
                    });
                }
            } else {
                console.log(err);
            }
        });
        res.send("OK");
    } else {
        res.send("NO");
    }
});

module.exports = http;