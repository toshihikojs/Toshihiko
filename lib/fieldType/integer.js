/**
 * XadillaX created at 2014-09-05 18:37
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
"use strict";

var Integer = {};
Integer.name = "Integer";
Integer.needQuotes = false;

/**
 * restore
 * @param {String|Number} parsed the parsed integer
 * @return {Number} the integer restored
 */
Integer.restore = function(parsed) {
    return parseInt(parsed);
};

/**
 * parse
 * @param {Number} orig the original integer
 * @return {Number} the integer
 */
Integer.parse = function(orig) {
    return parseInt(orig);
};

Integer.defaultValue = 0;

/**
 * equal
 * @param {Number|String} a integer I
 * @param {String|Number} b integer II
 * @return {Boolean} whether they are equal
 */
Integer.equal = function(a, b) {
    if(a === b) {
        return true;
    }

    return parseInt(a) === parseInt(b);
};

module.exports = Integer;
