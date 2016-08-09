/**
 * XadillaX created at 2016-08-09 10:17:01 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

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
