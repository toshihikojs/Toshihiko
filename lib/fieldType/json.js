/**
 * XadillaX created at 2014-09-05 18:47
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var Json = {};
Json.name = "Json";
Json.needQuotes = true;

Json.restore = function(parsed) {
    return JSON.stringify(parsed);
};

Json.parse = function(orig) {
    return JSON.parse(orig);
};

Json.equal = function(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
};

Json.defaultValue = {};

module.exports = Json;
