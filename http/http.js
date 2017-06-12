var express = require("express");
var session = require("../session/memory");

var http = express();

http.get("/push", function (req, res) {
    res.send("push to one people");
});

module.exports = http;