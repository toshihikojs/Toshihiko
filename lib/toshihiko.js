/**
 * XadillaX created at 2016-08-08 15:45:10 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const _ = require("lodash");
const EventEmitter = require("eventemitter2").EventEmitter2;

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
}

module.exports = Toshihiko;
