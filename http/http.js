var express = require("express");
var session = require("../session/memory").all();

var http = express();

http.post("/push/one", function (req, res) {
    //res.send(JSON.stringify(session.all()));
});

http.post("/push/all", function (req, res) {

});

module.exports = http;