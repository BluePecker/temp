var express = require("express");
var session = require("../session/memory");

var http = express();

http.post("/push/one", function (req, res) {
    session.all();
    res.send("xxxx");
});

http.post("/push/all", function (req, res) {

});

module.exports = http;