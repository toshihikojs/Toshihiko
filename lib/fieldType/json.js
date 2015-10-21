/**
 * XadillaX created at 2014-09-05 18:47
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
"use strict";

var fJSON = require("fbbk-json");

var Json = {};
Json.name = "Json";
Json.needQuotes = true;

/**
 * restore
 * @param {Object} parsed the json object
 * @return {String} the stringified json object
 */
Json.restore = function(parsed) {
    return JSON.stringify(parsed);
};

/**
 * parse
 * @param {String} orig the stringified json object
 * @return {Object} the json object
 */
Json.parse = function(orig) {
    try {
        return fJSON.parse(orig);
    } catch(e) {
        /* istanbul ignore if  */
        if(process.env.NODE_ENV !== "test") {
            console.error(
                "Toshihiko: Broken json value while parsing JSON type in Toshihiko: " +
                orig);
        }

        return {};
    }
};

/**
 * equal
 * @param {Object|String} a object I
 * @param {Object|String} b object II
 * @return {Boolean} whether they are equal
 */
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

