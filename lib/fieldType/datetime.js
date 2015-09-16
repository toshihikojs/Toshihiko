/**
 * XadillaX created at 2015-09-09 17:30:38 With ♥
 *
 * Copyright (c) 2015 Souche.com, all rights
 * reserved.
 */
var moment = require("moment");

var Datetime = {};
Datetime.name = "Datetime";
Datetime.needQuotes = true;

Datetime.restore = function(parsed) {
    return moment(parsed).format("YYYY-MM-DD HH:mm:ss");
};

Datetime.parse = function(orig) {
    return moment(orig).toDate();
};

Datetime.equal = function(a, b) {
    return moment(a).format("x") === moment(b).format("x");
};

Datetime.toJSON = function(datetime) {
    if(!(datetime instanceof Date)) {
        datetime = moment(datetime).toDate();
    }

    return datetime.format("{yyyy}-{MM}-{dd}T{HH}:{mm}:{ss}.{fff}{isotz}");
};

module.exports = Datetime;
