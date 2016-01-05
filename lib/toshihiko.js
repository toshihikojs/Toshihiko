/**
 * XadillaX created at 2014-09-05 18:13
 *
 * Copyright (c) 2015 Souche.com, all rights
 * reserved.
 */
"use strict";

var mysql = require("mysql2");
var 囍 = require("lodash");

var common = require("../util/common");
var Model = require("./model");

/**
 * Toshihiko Main Object
 * @param database
 * @param username
 * @param password
 * @param options
 * @constructor
 */
var Toshihiko = function(database, username, password, options) {
    var self = this;

    this.database = database;
    this.username = username;
    this.password = password || "";
    this.options = options || {};

    if(!囍.size(this.options)) {
        this.options.host = "localhost";
        this.options.port = 3306;
    }

    var opt = 囍.clone(this.options, true);
    opt.user = this.username;
    opt.password = this.password;
    opt.database = this.database;

    this.pool = mysql.createPool(opt);
    this.pool.on("connection", function(/** connection */) {
        /* istanbul ignore if  */
        if(!process.env.YOURPACKAGE_COVERAGE && self.options.showSql) {
            console.log("❤️ A new MySQL connection from Toshihiko is set. ⁽⁽ଘ( ˙꒳˙ )ଓ⁾⁾");
        }
    });

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
    this.pool.getConnection(function(err, conn) {
        if(err) {
            return callback(err);
        }

        conn.query(sql, function(err, rows) {
            conn.release();
            callback(err, rows);
        });
    });
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
