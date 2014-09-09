/**
 * XadillaX created at 2014-09-05 18:37
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var Integer = {};
Integer.name = "Integer";

Integer.restore = function(parsed) {
    return parsed.toString();
};

Integer.parse = function(orig) {
    return parseInt(orig);
};

Integer.defaultValue = 0;

module.exports = Integer;
