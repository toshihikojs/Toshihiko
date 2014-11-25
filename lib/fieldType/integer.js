/**
 * XadillaX created at 2014-09-05 18:37
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var Integer = {};
Integer.name = "Integer";
Integer.needQuotes = false;

Integer.restore = function(parsed) {
    return parseInt(parsed);
};

Integer.parse = function(orig) {
    return parseInt(orig);
};

Integer.defaultValue = 0;

Integer.equal = function(a, b) {
    if(a === b) return true;
    return parseInt(a) === parseInt(b);
};

module.exports = Integer;
