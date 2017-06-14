"use strict";

var mongoose = require("mongoose");

module.exports = mongoose.model("message", new mongoose.Schema({
    logic_id   : String,
    username   : String,
    from       : String,
    target     : String,
    target_name: String,
    content    : String,
    type       : String,
    session_id : String,
    extra_info : Object,
    read       : {
        type   : Boolean,
        default: false
    },
    created    : {
        type   : Date,
        default: Date.now
    },
    modified   : {
        type   : Date,
        default: Date.now
    }
}));