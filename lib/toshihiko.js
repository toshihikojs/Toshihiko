/**
 * XadillaX created at 2016-08-08 15:45:10 With ♥
 *
 * Copyright (c) 2018 XadillaX, all rights
 * reserved.
 */
"use strict";

const _ = require("lodash");
const EventEmitter = require("eventemitter2").EventEmitter2;

const common = require("../util/common");

const emptyFunc = function() {};

class Toshihiko extends EventEmitter {
    /**
     * Toshihiko
     * @param {Adapter} Adapter the adapter layer object
     * @param {Object} options the toshihiko options
     */
    constructor(Adapter, options) {
        super();

        this.options = options || {};
        const opt = _.clone(this.options, true);

        // create the adapter
        if(typeof Adapter === "string") {
            Adapter = require(`./adapters/${Adapter}`);
        }
        this.adapter = new Adapter(this, options);

        if(opt.cache) {
            this.cache = Toshihiko.createCache(opt.cache);
        }
    }

    /**
     * database
     * @returns {String} the database name
     */
    get database() {
        return this.adapter.getDBName();
    }

    /**
     * do adapter's execute
     * @param {...} [...] parameters
     * @param {Function} [callback] the callback function
     * @returns {Promise} the promise object
     */
    execute() {
        let trueCallback = emptyFunc;
        let cbIdx;
        for(let i = 0; i < arguments.length; i++) {
            if(typeof arguments[i] === "function") {
                trueCallback = arguments[i];
                cbIdx = i;
            }
        }
        const callback = common.promisify(trueCallback);
        if(cbIdx === undefined){
            arguments[arguments.length] = callback;
            arguments.length++;
        } else {
            arguments[cbIdx] = callback;
        }

        this.adapter.execute.apply(this.adapter, arguments);

        return callback.promise;
    }

    /**
     * define a model
     * @param {String} collectionName the collection name
     * @param {Array} schema the schema array
     * @param {Object} options the model options
     * @returns {ToshihikoModel} the toshihiko model
     */
    define(collectionName, schema, options) {
        const Model = require("./model");
        const model = new Model(collectionName, this, schema, options);
        return model;
    }
}

/**
 * create a cache object
 * @param {Object} param the options to create cache
 * @returns {ToshihikoCache} the cache object
 */
Toshihiko.createCache = function(param) {
    // if param itself is a cache instance
    if(typeof param.deleteData === "function" && typeof param.deleteKeys === "function" &&
        typeof param.setData === "function" && typeof param.getData === "function") {
        return param;
    }

    let path;
    if(param.module) {
        path = "$$$";
    } else if(param.path) {
        path = param.path;
    } else if(param.name) {
        path = `toshihiko-${param.name}`;
    } else {
        return null;
    }

    const m = param.module ? param.module : require(path);
    const func = m.create;
    const keys = common.getParamNames(func);

    // fill param.?? to Cache.create
    return func.apply(undefined, keys.map(key => param[key]));
};

module.exports = Toshihiko;
