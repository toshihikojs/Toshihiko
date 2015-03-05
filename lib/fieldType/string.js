/**
 * XadillaX created at 2014-09-05 18:29
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var Str = {};
Str.name = "String";
Str.needQuotes = true;

Str.restore = function(parsed) {
    if(!parsed) {
        return "";
    }

    return parsed.toString();
};

Str.parse = function(orig) {
    if(!orig) {
        return "";
    }

    return orig.toString();
};

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
