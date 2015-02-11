/**
 * XadillaX created at 2014-09-05 18:13
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var mysql = require("mysql");
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

    if(!Object.size(this.options)) {
        this.options.host = "localhost";
        this.options.port = 3306;
    }

    var opt = Object.clone(this.options, true);
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
};

/**
 * execute sql
 * @param sql
 * @param callback
 */
Toshihiko.prototype.execute = function(sql, callback) {
    this.pool.getConnection(function(err, conn) {
        if(err) return callback(err);
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

