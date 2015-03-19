/**
 * XadillaX created at 2015-03-19 13:45:10
 *
 * Copyright (c) 2015 Huaban.com, all rights
 * reserved
 */
var BaseEngine = function(options) {
    this.options = options;
};

BaseEngine.prototype.execute = function(sql, callback) {
    // to be inherited.
    sql = callback = undefined;
};

BaseEngine.prototype.format = function(sql, params) {
    // to be inherited.
    return params, sql;
};

module.exports = BaseEngine;

