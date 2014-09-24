/**
 * XadillaX created at 2014-09-05 18:15
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var sugar = require("sugar");
var Field = require("./field");
var Query = require("./query");
var Yukari = require("./yukari");

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

    // default memcached in Toshihiko
    if(undefined === this.options.memcached && this.toshihiko.options.memcached) {
        this.memcached = this.toshihiko.options.memcached;
    }
};

/**
 * get primary keys name
 * @returns {*}
 */
Model.prototype.getPrimaryKeysName = function() {
    if(!this.primaryKeys.length) return [];
    if(this.primaryKeys.length === 1) return this.primaryKeys[0].name;

    var result = [];
    for(var i = 0; i < this.primaryKeys.length; i++) {
        result.push(this.primaryKeys[i].name);
    }
    return result;
};

/**
 * build a new Yukari
 * @param fields
 * @returns {Yukari}
 */
Model.prototype.build = function(fields) {
    var yukari = new Yukari(this, "new");
    yukari._buildRow(fields);
    return yukari;
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
 * find by id
 * @param id
 * @param callback
 * @param [withJson]
 * @returns {*}
 */
Model.prototype.findById = function(id, callback, withJson) {
    if(this.primaryKeys.length === 1 && typeof id !== "object") {
        id = {};
        id[this.primaryKeys[0].name] = id;
    }

    if(typeof id !== "object") {
        return callback(new Error("You should pass a valid IDs object."));
    }

    this.where(id).findOne(callback, withJson);
};

/**
 * execute a certain sql
 * @param sql
 * @param [format]
 * @param callback
 * @returns {Query}
 */
Model.prototype.execute = function(sql, format, callback) {
    var query = new Query(this);
    return query.execute(sql, format, callback);
};

/**
 * update record(s) via condition
 * @param updateData
 * @param callback
 * @returns {*}
 */
Model.prototype.update = function(updateData, callback) {
    var query = new Query(this);
    return query.update(updateData, callback, withJson);
};

/**
 * delete one record
 * @param callback
 * @returns {Query}
 */
Model.prototype.delete = function(callback) {
    var query = new Query(this);
    return query.delete(callback);
};

/**
 * find just one record
 * @param callback
 * @param [withJson]
 * @returns {Query}
 */
Model.prototype.findOne = function(callback, withJson) {
    var query = new Query(this);
    return query.findOne(callback, withJson);
};

/**
 * get count for one condition
 * @param callback
 * @returns {*}
 */
Model.prototype.count = function(callback) {
    var query = new Query(this);
    return query.count(callback);
};

/**
 * find records
 * @param callback
 * @param [withJson]
 * @returns {Query}
 */
Model.prototype.find = function(callback, withJson) {
    var query = new Query(this);
    return query.find(callback, withJson);
};

module.exports = Model;
