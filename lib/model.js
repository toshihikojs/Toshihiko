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
 * @returns {*}
 */
Model.prototype.findById = function(id, callback) {
    if(this.primaryKeys.length === 1 && typeof id !== "object") {
        id = {};
        id[this.primaryKeys[0].name] = id;
    }

    if(typeof id !== "object") {
        return callback(new Error("You should pass a valid IDs object."));
    }

    this.where(id).findOne(callback);
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
 * @returns {Query}
 */
Model.prototype.findOne = function(callback) {
    var query = new Query(this);
    return query.findOne(callback);
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
