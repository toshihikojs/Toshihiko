/**
 * XadillaX created at 2014-09-05 18:13
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var Model = require("./model");
var common = require("../util/common");
var engine = require("./engine");

/**
 * Toshihiko Main Object
 * @param database
 * @param username
 * @param password
 * @param options
 * @constructor
 */
var Toshihiko = function(database, username, password, options) {
    this.database = database;
    this.username = username;
    this.password = password || "";
    this.options = options || {};

    if(!Object.size(this.options)) {
        this.options.host = "localhost";
        this.options.port = 3306;
    }

    // database engine
    this.options.engine = this.options.engine || "mysql";

    var opt = Object.clone(this.options, true);
    opt.user = this.username;
    opt.password = this.password;
    opt.database = this.database;

    this.engine = engine.createEngine(this.options.engine, opt);

    // cache...
    if(opt.cache) {
        this.cache = Toshihiko._createCache(opt.cache);
    }
};

/**
 * create cache object
 * @param {Object} param the param to create a cache object
 * @return {Object} the cache object
 */
Toshihiko._createCache = function(param) {
    // the cache object itself
    if(typeof param.deleteData === "function" && typeof param.deleteKeys === "function" &&
        typeof param.setData === "function" && typeof param.getData === "function") {
        return param;
    }

    // new from name || path
    var path;
    if(param.path) {
        path = param.path;
    } else if(param.name) {
        path = "toshihiko-" + param.name;
    } else {
        return null;
    }

    var module = require(path);
    var func = module.create;
    var keys = common.getParamNames(func);
    return func.apply(undefined, keys.map(function(key) {
        return param[key];
    }));
};

/**
 * execute sql
 * @param sql
 * @param callback
 */
Toshihiko.prototype.execute = function(sql, callback) {
    this.engine.execute(sql, callback);
};

/**
 * format sql
 * @param {String} sql the sql
 * @param {Array} arr the array
 * @return {String} the formated sql
 */
Toshihiko.prototype.format = function(sql, arr) {
    return this.engine.format(sql, arr);
};

/**
 * define a model
 * @param table
 * @param fields
 * @param options
 * @returns {Model}
 */
Toshihiko.prototype.define = function(table, fields, options) {
    var model = new Model(table, this, fields, options);
    return model;
};

module.exports = Toshihiko;

