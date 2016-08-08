/**
 * XadillaX created at 2016-08-08 17:04:12 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const cu = require("config.util");
const debug = require("debug")("toshihiko:adapter:mysql");

const Adapter = require("./base");

function onConnection() {
    this.emit("log", "A new MySQL connection from Toshihiko is set. ⁽⁽ଘ( ˙꒳˙ )ଓ⁾⁾");
}

class MySQLAdapter extends Adapter {
    constructor(parent, options) {
        super(parent, options);

        this.options = cu.extendDeep({}, {
            username: "",
            password: "",
            database: "toshihiko",
            host: "localhost",
            port: 3306
        }, this.options);

        const PASSWORD = this.options.password;
        Object.defineProperties(this, {
            username: {
                value: this.options.username,
                enumerable: true
            },
            database: {
                value: this.options.database,
                enumerable: true
            }
        });

        delete this.options.username;
        delete this.options.database;
        delete this.options.password;

        const opt = cu.extendDeep({}, this.options, {
            user: this.username,
            database: this.database,
            password: PASSWORD
        });

        // try to require mysql adapter
        let mysql;
        if(!this.options.package) {
            try {
                mysql = require("mysql2");
            } catch(e) {
                debug("fallback to use mysql.");
                mysql = require("mysql");
            }
        } else {
            debug(`use package "${this.options.package}" as adapter`);
            mysql = require(this.options.package);
        }

        Object.defineProperty(this, "mysql", {
            value: mysql.createPool(opt),

            enumerable: false,
            writable: false,
            configurable: false
        });

        // let mysql be compatibility with Toshihiko version 0.x
        // set toshihiko.pool when using mysql
        Object.defineProperty(parent, "pool", {
            configurable: true,
            enumerable: false,
            get: () => this.mysql
        });

        this.mysql.on("connection", onConnection.bind(this));

        debug("created.", this);
    }
}

module.exports = MySQLAdapter;
