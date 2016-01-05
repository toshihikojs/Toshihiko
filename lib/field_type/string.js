/**
 * XadillaX created at 2014-09-05 18:29
 *
 * Copyright (c) 2015 Souche.com, all rights
 * reserved.
 */
"use strict";

var Str = {};
Str.name = "String";
Str.needQuotes = true;

/**
 * restore
 * @param {String} parsed the parsed string
 * @return {String} the string restored
 */
Str.restore = function(parsed) {
    if(undefined === parsed || null === parsed) {
        return "";
    }

    return parsed.toString();
};

/**
 * parse
 * @param {String} orig the original string
 * @return {String} the string
 */
Str.parse = function(orig) {
    if(undefined === orig || null === orig) {
        return "";
    }

    return orig.toString();
};

/**
 * equal
 * @param {String} a string I
 * @param {String} b string II
 * @return {Boolean} whether they are equal
 */
Str.equal = function(a, b) {
    if(a === b) {
        return true;
    }

    try {
        return a.toString() === b.toString();
    } catch(e) {
        return false;
    }
};

Str.defaultValue = "";

module.exports = Str;
