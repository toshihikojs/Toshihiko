/**
 * XadillaX created at 2016-08-08 17:04:49 With ♥
 *
 * Copyright (c) 2018 XadillaX, all rights
 * reserved.
 */
"use strict";

const debug = require("debug")("toshihiko:adapter:base");
const EventEmitter = require("eventemitter2").EventEmitter2;

const common = require("../../util/common");

class Adapter extends EventEmitter {
    /**
     * BaseAdapter
     * @param {Toshihiko} parent the parent toshihiko object
     * @param {Object} options the options object
     */
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

    /**
     * find
     * @param {ToshihikoQuery} query toshihiko query object
     * @param {Function} callback the callback function
     * @param {Object} options the options object
     */
    find(query, callback, options) {
        options = null;
        process.nextTick(function() {
            callback(new Error("this adapter's find function is not implemented yet."));
        });
    }

    /**
     * count
     * @param {ToshihikoQuery} query toshihiko query object
     * @param {Function} callback the callback function
     */
    count(query, callback) {
        process.nextTick(function() {
            callback(new Error("this adapter's count function is not implemented yet."));
        });
    }

    /**
     * update by query
     * @param {ToshihikoQuery} query toshihiko query object
     * @param {Function} callback the callback function
     */
    updateByQuery(query, callback) {
        process.nextTick(function() {
            callback(new Error("this adapter's updateByQuery function is not implemented yet."));
        });
    }

    /**
     * delete by query
     * @param {ToshihikoQuery} query toshihiko query object
     * @param {Function} callback the callback function
     */
    deleteByQuery(query, callback) {
        process.nextTick(function() {
            callback(new Error("this adapter's deleteByQuery function is not implemented yet."));
        });
    }

    /**
     * insert
     * @param {ToshihikoModel} model the toshihiko model object
     * @param {Object} data data to be inserted
     * @param {Function} callback the callback function
     */
    insert(model, conn, data, callback) {
        process.nextTick(function() {
            callback(new Error("this adapter's insert function is not implemented yet."));
        });
    }

    /**
     * update
     * @param {ToshihikoModel} model the toshihiko model object
     * @param {Object} pk the primary key(s) object that the yukari object owned
     * @param {Object} data data to be updated
     * @param {Function} callback the callback function
     */
    update(model, conn, pk, data, callback) {
        process.nextTick(function() {
            callback(new Error("this adapter's update function is not implemented yet."));
        });
    }

    /**
     * execute
     * @param {...} [...] parameters
     * @param {Function} callback the callback function
     */
    execute() {
        const callback = arguments[arguments.length - 1];
        process.nextTick(function() {
            callback(new Error("this adapter's execute function is not implemented yet."));
        });
    }

    /**
     * get database name
     * @returns {String} the database name
     */
    getDBName() {
        return "";
    }

    /**
     * beginTransaction
     * @param {Function} callback the callback function
     */
    beginTransaction(callback) {
        process.nextTick(function() {
            callback(new Error("this adapter's beginTransaction function is not implemented yet."));
        });
    }

    /**
     * commit
     * @param {Connection} conn the connection to be committed
     * @param {Function} callback the callback function
     */
    commit(conn, callback) {
        process.nextTick(function() {
            callback(new Error("this adapter's commit function is not implemented yet."));
        });
    }

    /**
     * rollback
     * @param {Connection} conn the connection to be rolled-back
     * @param {Function} callback the callback function
     */
    rollback(conn, callback) {
        process.nextTick(function() {
            callback(new Error("this adapter's rollback function is not implemented yet."));
        });
    }
}

module.exports = Adapter;
