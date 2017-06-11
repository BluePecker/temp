"use strict";

var Schema = require("mongoose").Schema;

module.exports = new Schema({
    logic_id: String,
    username: String,
    from    : Schema.ObjectId,
    target  : Schema.ObjectId,
    content : String,
    type    : String,
    read    : {
        type   : Boolean,
        default: false
    },
    created : {
        type   : Date,
        default: Date.now
    },
    modified: {
        type   : Date,
        default: Date.now
    }
});