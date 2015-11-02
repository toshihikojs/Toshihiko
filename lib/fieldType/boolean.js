/**
 * XadillaX created at 2015-11-02 10:40:53 With ♥
 *
 * Copyright (c) 2015 Souche.com, all rights
 * reserved.
 */
"use strict";

var _Boolean = {};
_Boolean.name = "_Boolean";
_Boolean.needQuotes = false;

/**
 * restore
 * @param {_Boolean} parsed the parsed integer
 * @return {Number} the integer restored
 */
_Boolean.restore = function(parsed) {
    return (parsed ^ 0) & 1;
};

/**
 * parse
 * @param {Number} orig the original integer
 * @return {_Boolean} the boolean value
 */
_Boolean.parse = function(orig) {
    return !!orig;
};

_Boolean.defaultValue = 0;

/**
 * equal
 * @param {Number|Boolean} a integer I
 * @param {Number|Boolean} b integer II
 * @return {Boolean} whether they are equal
 */
_Boolean.equal = function(a, b) {
    a = !!a;
    b = !!b;
    return a === b;
};

module.exports = _Boolean;
