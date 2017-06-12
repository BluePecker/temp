var express = require("express");
var session = require("../session/memory");

var http = express();

http.post("/push/one", function (req, res) {

});

http.post("/push/all", function (req, res) {

});

module.exports = http;