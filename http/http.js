var express = require("express");
var session = require("../session/memory");

var http = express();

http.get("/push/:user_id", function (req, res, next, id) {
    console.log(id);
    res.send("push to one people");
});

module.exports = http;