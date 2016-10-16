/**
 * XadillaX created at 2016-08-08 17:04:49 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const debug = require("debug")("toshihiko:adapter:base");
const EventEmitter = require("eventemitter2").EventEmitter2;

const common = require("../../util/common");

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
                value: common.extend({}, options || {}),
                writable: true,
                configurable: false,
                enumerable: true
            }
        });

        debug("created.", this);
    }

    find(query, callback, options) {
        options = null;
        process.nextTick(function() {
            callback(new Error("this adapter's find function is not implemented yet."));
        });
    }

    count(query, callback) {
        process.nextTick(function() {
            callback(new Error("this adapter's count function is not implemented yet."));
        });
    }

    updateByQuery(query, callback) {
        process.nextTick(function() {
            callback(new Error("this adapter's updateByQuery function is not implemented yet."));
        });
    }

    deleteByQuery(query, callback) {
        process.nextTick(function() {
            callback(new Error("this adapter's deleteByQuery function is not implemented yet."));
        });
    }

    insert(model, data, callback) {
        process.nextTick(function() {
            callback(new Error("this adapter's insert function is not implemented yet."));
        });
    }

    update(model, pk, data, callback) {
        process.nextTick(function() {
            callback(new Error("this adapter's update function is not implemented yet."));
        });
    }

    execute() {
        const callback = arguments[arguments.length - 1];
        process.nextTick(function() {
            callback(new Error("this adapter's execute function is not implemented yet."));
        });
    }

    getDBName() {
        return "";
    }
}

module.exports = Adapter;
