/**
 * XadillaX created at 2016-08-08 17:04:49 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const cu = require("config.util");
const debug = require("debug")("toshihiko:adapter:base");
const EventEmitter = require("eventemitter2").EventEmitter2;

class Adapter extends EventEmitter {
    constructor(parent, options) {
        super();

        Object.defineProperties(this, {
            parent: {
                value: parent,
                writable: false,
                configurable: false,
                enumerable: false
            },
            options: {
                value: cu.extendDeep({}, options || {}),
                writable: true,
                configurable: false,
                enumerable: true
            }
        });

        debug("created.", this);
    }

    execute(param, callback) {
        debug("this adapter instance's execute is not implemented.");
        process.nextTick(callback);
    }

    find(query, callback, options) {
        options = null;
        process.nextTick(function() {
            callback(new Error("this adapter's find function is not implemented yet."));
        });
    }

    getDBName() {
        return "";
    }
}

module.exports = Adapter;
