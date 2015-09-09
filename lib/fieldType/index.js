/**
 * XadillaX created at 2014-09-05 18:30
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var _String = require("./string");
var Integer = require("./integer");
var Float = require("./float");
var Json = require("./json");
var Datetime = require("./datetime");

module.exports = {
    String      : _String,
    Integer     : Integer,
    Float       : Float,
    Json        : Json,
    Datetime    : Datetime,

    $equal      : function(a, b) {
        return a === b;
    }
};
