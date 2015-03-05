/**
 * XadillaX created at 2014-09-05 18:13
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var _Memcached = require("memcached");
var EventEmitter = require("events").EventEmitter;
var util = require("util");
require("algorithmjs");
var Scarlet = require("scarlet-task");
var async = require("async");

var MEMCACHED_COMMAND_MAX_LENGTH = 250;

/**
 * cmp function for qsort
 * @param a
 * @param b
 * @return boolean
 */
function __sortFunc(a, b) {
    return a < b;
}

/**
 * Toshihiko-used memcached object
 * @param servers refer to https://github.com/3rd-Eden/node-memcached#server-locations
 * @param options refer to https://github.com/3rd-Eden/node-memcached#options, and you may give a prefix
 * @constructor
 */
var Memcached = function(servers, options) {
    EventEmitter.call(this);

    this.servers = servers;
    this.options = options;
    this.prefix = (options && options.prefix) ? options.prefix : "";

    if(options) {
        delete options.prefix;
    }

    this.memcached = new _Memcached(this.servers, this.options);

    var self = this;
    this.memcached.on("failure", function(details) {
        self.emit("failure", details);
    });
    this.memcached.on("reconnecting", function(details) {
        self.emit("reconnecting", details);
    });

    if(options && options.customizeKey) {
        this._getKey = options.customizeKey.bind(this);
    }
};

util.inherits(Memcached, EventEmitter);

/**
 * set customize key function
 * @param {function} func
 */
Memcached.prototype.setCustomizeKeyFunc = function(func) {
    this._getKey = func.bind(this);
};

/**
 * get memcached key
 * @param dbName
 * @param tableName
 * @param key
 * @returns {string}
 * @private
 */
Memcached.prototype._getKey = function(dbName, tableName, key) {
    if(typeof key !== "object") {
        return this.prefix + dbName + ":" + tableName + ":" + key;
    }

    // get primary keys
    var keys = Object.keys(key);
    if(!keys.length) {
        return this.prefix + dbName + ":" + tableName;
    } else if(keys.length === 1) {
        return this.prefix + dbName + ":" + tableName + ":" + key[keys[0]];
    }

    var minlen = 1;
    for(var i = 0; i < keys.length; i++) {
        for(var j = i + 1; j < keys.length; j++) {
            var ml = Math.min(keys[i].length, keys[j].length);
            for(var k = 0; k < ml; k++) {
                if(keys[i][k] !== keys[j][k]) {
                    if(k > minlen) {
                        minlen = k;
                    }
                    break;
                }
            }

            if(k === ml && k > minlen) {
                minlen = k;
            }
        }
    }

    // sort keys
    keys.qsort(__sortFunc);

    // add keys to memcached key
    var base = this.prefix + dbName + ":" + tableName;
    for(var i = 0; i < keys.length; i++) {
        base += ":";
        base += keys[i].substr(0, minlen);
        base += key[keys[i]];
    }

    return base;
};

/**
 * generate memcached keys
 * @param dbName
 * @param tableName
 * @param keys
 * @returns {*|Array}
 * @private
 */
Memcached.prototype._getKeys = function(dbName, tableName, keys) {
    var self = this;
    return keys.map(function(key) {
        return self._getKey(dbName, tableName, key);
    });
};

/**
 * delete data from memcached
 * @param dbName
 * @param table
 * @param key
 * @param callback
 */
Memcached.prototype.deleteData = function(dbName, tableName, key, callback) {
    key = this._getKey(dbName, tableName, key);
    this.memcached.del(key, callback);
};

/**
 * delete keys from memcached
 * @param dbName
 * @param tableName
 * @param keys
 * @param callback
 */
Memcached.prototype.deleteKeys = function(dbName, tableName, keys, callback) {
    var self = this;
    async.eachLimit(keys, 10, function(key, callback) {
        self.deleteData(dbName, tableName, key, callback);
    }, function(err) {
        callback(err);
    });
};

/**
 * set data to memcached
 * @param dbName
 * @param tableName
 * @param key
 * @param data
 * @param callback
 */
Memcached.prototype.setData = function(dbName, tableName, key, data, callback) {
    key = this._getKey(dbName, tableName, key);
    this.memcached.set(key, data, 0, callback);
};

/**
 * get crowd of data
 * @param keys
 * @param callback
 */
Memcached.prototype.getCrowdOfData = function(keys, callback) {
    this.memcached.getMulti(keys, function(err, data) {
        if(err) {
            return callback(err);
        }

        var result = [];
        for(var i = 0; i < keys.length; i++) {
            if(data[keys[i]]) {
                result.push(data[keys[i]]);
            }
        }
        callback(undefined, result);
    });
};

/**
 * get data in memcached
 * @param dbName
 * @param tableName
 * @param keys
 * @param callback
 * @returns {*}
 */
Memcached.prototype.getData = function(dbName, tableName, keys, callback) {
    var self = this;

    if(!util.isArray(keys)) {
        keys = [keys];
    }

    // generate memcached keys
    keys = this._getKeys(dbName, tableName, keys);

    // no data to find
    if(!keys.length) {
        return callback(undefined, []);
    }

    // only one data to find
    if(keys.length === 1) {
        this.memcached.get(keys[0], function(err, data) {
            if(err) {
                return callback(err);
            }

            if(undefined === data) {
                return callback(undefined, []);
            }

            callback(undefined, [ data ]);
        });
        return;
    }

    // otherwise...
    var crowd = [ [] ];
    var str = "get";
    for(var i = 0; i < keys.length; i++) {
        str += " ";
        str += keys[i];

        if(str.length > MEMCACHED_COMMAND_MAX_LENGTH) {
            crowd.push([]);
            str = "get";
            str += " ";
            str += keys[i];
        }

        crowd[crowd.length - 1].push(keys[i]);
    }

    var errs = [];
    var result = [];
    var scarlet = new Scarlet(1);

    var scarletProcessor = function(TO) {
        var keys = TO.task;
        self.getCrowdOfData(keys, function(err, data) {
            return err ? errs.push(err) : result.add(data), scarlet.taskDone(TO);
        });
    };

    // get crowd of data one by one
    for(var i = 0; i < crowd.length; i++) {
        scarlet.push(crowd[i], scarletProcessor);
    }

    // the `done` function
    scarlet.afterFinish(crowd.length, function() {
        return callback(errs.length ? errs[0] : undefined, result);
    });
};

module.exports = Memcached;

