/**
 * XadillaX created at 2015-09-09 17:30:38 With ♥
 *
 * Copyright (c) 2015 Souche.com, all rights
 * reserved.
 */
"use strict";

var moment = require("moment");

var Datetime = {};
Datetime.name = "Datetime";
Datetime.needQuotes = true;

/**
 * restore
 * @param {Date|Number|String} parsed the parsed datetime object
 * @return {String} the original datetime type in mysql2
 */
Datetime.restore = function(parsed) {
    return moment(parsed).format("YYYY-MM-DD HH:mm:ss");
};

/**
 * parse
 * @param {String} orig the original mysql2 datetime type
 * @return {String} the parsed datetime string
 */
Datetime.parse = function(orig) {
    return moment(orig).toDate();
};

/**
 * equal
 * @param {Date|Number|String} a object I
 * @param {Date|Number|String} b object II
 * @return {Boolean} whether they are equal
 */
Datetime.equal = function(a, b) {
    return moment(a).format("x") === moment(b).format("x");
};

/**
 * toJSON
 * @param {Date|Number|String} datetime the datetime object
 * @return {Object} the json object
 */
Datetime.toJSON = function(datetime) {
    if(!(datetime instanceof Date)) {
        datetime = moment(datetime).toDate();
    }

    return datetime.format("{yyyy}-{MM}-{dd}T{HH}:{mm}:{ss}.{fff}{isotz}");
};

module.exports = Datetime;
