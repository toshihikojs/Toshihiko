/**
 * XadillaX created at 2014-09-05 18:47
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var fJSON = require("fbbk-json");

var Json = {};
Json.name = "Json";
Json.needQuotes = true;

Json.restore = function(parsed) {
    return JSON.stringify(parsed);
};

Json.parse = function(orig) {
    try {
        return fJSON.parse(orig);
    } catch(e) {
        /* istanbul ignore if  */
        if(process.env.NODE_ENV !== "test") {
            console.error("Toshihiko: Broken json value while parsing JSON type in Toshihiko: " +
                          orig);
        }
        return {};
    }
};

Json.equal = function(a, b) {
    if(a === b) {
        return true;
    }

    try {
        return JSON.stringify(a) === JSON.stringify(b);
    } catch(e) {
        return false;
    }
};

Json.defaultValue = {};

module.exports = Json;

