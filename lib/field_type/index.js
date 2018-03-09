/**
 * XadillaX created at 2014-09-05 18:30
 *
 * Copyright (c) 2018 XadillaX, all rights
 * reserved.
 */
"use strict";

var _Boolean = require("./boolean");
var _String = require("./string");
var Datetime = require("./datetime");
var Float = require("./float");
var Integer = require("./integer");
var Json = require("./json");

module.exports = {
    String: _String,
    Boolean: _Boolean,
    Integer: Integer,
    Float: Float,
    Json: Json,
    Datetime: Datetime,

    $equal: function(a, b) {
        return a === b;
    }
};
