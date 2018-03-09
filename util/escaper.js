/**
 * XadillaX created at 2016-08-12 12:08:43 With ♥
 *
 * Copyright (c) 2018 XadillaX, all rights
 * reserved.
 */
"use strict";

const Escaper = module.exports = {};

/**
 * escape SQL string
 * @param {String} str the sql string
 * @returns {String} the escaped string
 */
Escaper.escape = function(str) {
    if(typeof str !== "string") {
        return str;
    }

    return str.split("").reduce(function(str, ch) {
        switch(ch) {
            case "\n"   : str += "\\n"; break;
            case "'"    : str += "\\'"; break;
            case "\""   : str += "\\\""; break;
            case "\t"   : str += "\\t"; break;
            case "\0"   : str += "\\0"; break;
            case "\r"   : str += "\\r"; break;
            case "\b"   : str += "\\b"; break;
            case "\x1a" : str += "\\Z"; break;
            case "\\"   : str += "\\\\"; break;

            default: str += ch; break;
        }
        return str;
    }, "");
};

/**
 * escape SQL string for LIKE
 * @param {String} str the sql string
 * @returns {String} the escaped string
 */
Escaper.escapeLike = function(str) {
    return str.split("").reduce(function(str, ch) {
        if(ch === "_" || ch === "%") {
            str += "\\";
        }
        str += ch;
        return str;
    }, "");
};
