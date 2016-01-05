/**
 * XadillaX created at 2014-09-05 18:30
 *
 * Copyright (c) 2015 Souche.com, all rights
 * reserved.
 */
"use strict";

var _String = require("./string");
var _Boolean = require("./boolean");
var Integer = require("./integer");
var Float = require("./float");
var Json = require("./json");
var Datetime = require("./datetime");

module.exports = {
    String      : _String,
    Boolean     : _Boolean,
    Integer     : Integer,
    Float       : Float,
    Json        : Json,
    Datetime    : Datetime,

    $equal      : function(a, b) {
        return a === b;
    }
};
