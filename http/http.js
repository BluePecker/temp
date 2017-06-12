var express = require("express");
var parser = require("body-parser");
var form_data = require("multer");
var message = require("../schema/message");
var session = require("../session/memory");

var http = express();

http.use(parser.json());
http.use(form_data());
http.use(parser.urlencoded({
    extended: true
}));

http.get("/push", function (req, res) {
    var params = req.body;
    if (params.username != params.from != params.target != params.content != undefined) {
        var content = {
            logic_id: "chat",
            username: params.username,
            from    : params.from,
            target  : params.target,
            content : params.content,
            type    : "text"
        };
        if (!session.alive(params.user_id)) {
            (new message(content)).save(function (err) {
                if (err != null) {
                    res.send("OK");
                } else {
                    res.send("NO");
                }
            });
        } else {
            session.get(params.user_id).send(JSON.stringify(content));
            res.send("OK");
        }
    } else {
        res.send("NO");
    }
});

module.exports = http;