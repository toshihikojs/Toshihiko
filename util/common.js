/**
 * XadillaX created at 2016-08-09 10:17:01 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const _ = require("lodash");
const debug = require("debug")("toshihiko:common");

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;

const common = module.exports = {};

/**
 * get param names for a function
 * @param {Function} func the function which will be parsed
 * @returns {Array} the param names
 */
common.getParamNames = function(func) {
    const fnStr = func.toString().replace(STRIP_COMMENTS, "");
    debug("function detected.", fnStr);
    const result = fnStr.slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")")).match(ARGUMENT_NAMES);
    return (null === result) ? [] : result;
};

/**
 * extend object
 * @param {Object} _default the default object
 * @param {Object} options the extend object
 * @returns {Object} the extended object
 */
common.extend = function(_default, options) {
    _default = _default || {};
    const obj = _.cloneDeep(options);

    for(let key in _default) {
        if(!_default.hasOwnProperty(key)) continue;

        if(undefined === obj[key]) {
            obj[key] = _.cloneDeep(_default[key]);
            continue;
        }

        if(typeof _default[key] === "object" && typeof obj[key] === "object") {
            obj[key] = common.extend(obj[key], _default[key]);
            continue;
        }
    }

    return obj;
};

/**
 * make a callback function promisify
 * @param {Function} [callback] the callback function
 * @returns {Function} the new callback function with promise
 */
common.promisify = function(callback) {
    // not using Promise.promisify because I don't want to wrap code logic
    // in a Promise
    //
    // I DO LIKE CALLBACK
    let resolve;
    let reject;
    const q = new Promise(function(_resolve, _reject) {
        // this function will be called synchronous
        //
        // see
        //
        // https://github.com/petkaantonov/bluebird/blob/v3.4.6/src/promise.js#L78
        //
        // and
        //
        // https://github.com/petkaantonov/bluebird/blob/v3.4.6/src/debuggability.js#L303-L309
        //
        // so we can assign them directly
        resolve = _resolve;
        reject = _reject;
    });

    // let it be compitable with 0.9
    q.$promise = q;

    const newCallback = function() {
        if(typeof callback === "function") {
            callback.apply(null, arguments);
        }

        if(arguments[0]) {
            reject(arguments[0]);
        } else {
            resolve(arguments[1]);
        }
    };
    newCallback.promise = q;

    return newCallback;
};
