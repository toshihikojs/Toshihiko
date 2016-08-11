/**
 * XadillaX created at 2016-08-08 15:45:10 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const _ = require("lodash");
const EventEmitter = require("eventemitter2").EventEmitter2;

const common = require("../util/common");

class Toshihiko extends EventEmitter {
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

    execute() {
        this.adapter.execute.apply(this.adapter, arguments);
    }

    define(collectionName, schema, options) {
        const Model = require("./model");
        const model = new Model(collectionName, this, schema, options);
        return model;
    }
}

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
