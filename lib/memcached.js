/**
 * XadillaX created at 2014-09-05 18:13
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var _Memcached = require("memcached");
var EventEmitter = require("events").EventEmitter;
var util = require("util");

/**
 * Toshihiko-used memcached object
 * @param servers refer to https://github.com/3rd-Eden/node-memcached#server-locations
 * @param options refer to https://github.com/3rd-Eden/node-memcached#options
 * @constructor
 */
var Memcached = function(servers, options) {
    EventEmitter.call(this);

    this.servers = servers;
    this.options = options;

    this.memcached = new _Memcached(this.servers, this.options);

    var self = this;
    this.memcached.on("failure", function(details) {
        self.emit("failure", details);
    });
    this.memcached.on("reconnecting", function(details) {
        self.emit("reconnecting", details);
    });
};

util.inherits(Memcached, EventEmitter);

module.exports = Memcached;
