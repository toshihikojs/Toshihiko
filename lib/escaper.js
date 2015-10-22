/**
 * XadillaX created at 2014-09-09 16:25
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
"use strict";

/**
 * escape sql
 * @param str
 * @returns {*}
 */
exports.escape = function(str) {
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
 * escape like
 * @param str
 * @returns {*}
 */
exports.escapeLike = function(str) {
    return str.split("").reduce(function(str, ch) {
        if(ch === "_" || ch === "%") {
            str += "\\";
        }
        str += ch;
        return str;
    }, "");
};
