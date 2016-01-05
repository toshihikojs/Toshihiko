/**
 * XadillaX created at 2014-09-05 18:45
 *
 * Copyright (c) 2015 Souche.com, all rights
 * reserved.
 */
"use strict";

var Float = {};
Float.name = "Float";
Float.needQuotes = false;

/**
 * restore
 * @param {String|Number} parsed the parsed float
 * @return {Number} the float restored
 */
Float.restore = function(parsed) {
    return parseFloat(parsed);
};

/**
 * parse
 * @param {Number} orig the original float
 * @return {Number} the float
 */
Float.parse = function(orig) {
    return parseFloat(orig);
};

Float.defaultValue = 0.0;

/**
 * equal
 * @param {Number|String} a float I
 * @param {String|Number} b float II
 * @return {Boolean} whether they are equal
 */
Float.equal = function(a, b) {
    if(a === b) {
        return true;
    }

    return parseFloat(a) === parseFloat(b);
};

module.exports = Float;

