/**
 * XadillaX created at 2014-09-05 18:15
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var sugar = require("sugar");
var Field = require("./field");
var Query = require("./query");

/**
 * Toshihiko Model
 * @param name
 * @param toshihiko
 * @param fields
 * @param options
 * @constructor
 */
var Model = function(name, toshihiko, fields, options) {
    var self = this;

    this.primaryKeys = [];

    this.name = name;
    this.toshihiko = toshihiko;
    this.db = toshihiko.pool;

    // fields
    this._fields = fields;
    this._fieldsObject = fields.map(function(field) {
        var f = new Field(field);
        if(f.primaryKey) self.primaryKeys.push(f);

        return f;
    });

    this.options = options || {};

    // memcached
    if(this.options.memcached) {
        this.memcached = this.options.memcached;
    } else {
        this.memcached = null;
    }
};

/**
 * give order
 * @param order
 * @returns {Query}
 */
Model.prototype.orderBy = function(order) {
    var query = new Query(this);
    return query.orderBy(order);
};

/**
 * give limit
 * @param limit
 * @returns {Query}
 */
Model.prototype.limit = function(limit) {
    var query = new Query(this);
    return query.limit(limit);
};

/**
 * where condition
 * @param condition
 * @returns {Query}
 */
Model.prototype.where = function(condition) {
    var query = new Query(this);
    return query.where(condition);
};

/**
 * find records
 * @param callback
 * @returns {Query}
 */
Model.prototype.find = function(callback) {
    var query = new Query(this);
    return query.find(callback);
};

module.exports = Model;
