/**
 * XadillaX created at 2014-09-24 11:28
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
"use strict";

var damnArguments = require("../util/damnarguments");
var BlueBird = require("bluebird");

/**
 * Result Promisor
 * @constructor
 */
var ResultPromisor = function() {
    this._err = undefined;
    this._result = undefined;
    this._resultGot = false;

    this.onCallback = [];
    this.onSuccess = [];
    this.onError = [];
};

/**
 * copy results
 * @returns {Array}
 * @private
 */
ResultPromisor.prototype._copyResults = function() {
    var res = [];
    for(var i = 0; i < this._result.length; i++) {
        res.push(this._result[i]);
    }

    return res;
};

/**
 * run error
 * @param callback
 * @private
 */
ResultPromisor.prototype._runError = function(callback) {
    var err = this._err;
    process.nextTick(function() {
        callback(err);
    });
};

/**
 * run success
 * @param callback
 * @private
 */
ResultPromisor.prototype._runSuccess = function(callback) {
    damnArguments.call(this._copyResults(), callback, true);
};

/**
 * run callback
 * @param callback
 * @private
 */
ResultPromisor.prototype._runCallback = function(callback) {
    var result = this._copyResults();
    result.unshift(this._err);
    damnArguments.call(result, callback, true);
};

/**
 * on success
 * @param callback
 */
ResultPromisor.prototype.success = function(callback) {
    if(!this._resultGot) {
        this.onSuccess.push(callback);
    } else if(!this._err) {
        this._runSuccess(callback);
    }

    return this;
};

/**
 * on error
 * @param callback
 */
ResultPromisor.prototype.error = function(callback) {
    if(!this._resultGot) {
        this.onError.push(callback);
    } else if(this._err) {
        this._runError(callback);
    }

    return this;
};

/**
 * on finished (no matter success or error)
 * @param callback
 */
ResultPromisor.prototype.finished = function(callback) {
    if(!this._resultGot) {
        this.onCallback.push(callback);
    } else {
        this._runCallback(callback);
    }

    return this;
};

/**
 * on execute result
 * @param err
 * @param result
 * @param ...
 * @returns {ResultPromisor}
 * @private
 */
ResultPromisor.prototype._onExecuteResult = function(err/**, result */) {
    this._err = err;
    this._result = Array.prototype.slice.call(arguments);
    this._resultGot = true;
    if(this._result.length >= 1) {
        this._result.shift();
    }

    // error | success
    var cb;
    if(this._err) {
        while(this.onError.length) {
            cb = this.onError.shift();
            this._runError(cb);
        }
    } else {
        while(this.onSuccess.length) {
            cb = this.onSuccess.shift();
            this._runSuccess(cb);
        }
    }

    while(this.onCallback.length) {
        cb = this.onCallback.shift();
        this._runCallback(cb);
    }

    return this;
};

/**
 * return true promise
 * @returns {BlueBird}
 */
ResultPromisor.prototype.__defineGetter__("$promise", function () {
    var self = this;
    return new BlueBird(function(resolve, reject){
        self.finished(function(err, res){
            if(err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
});

module.exports = ResultPromisor;
