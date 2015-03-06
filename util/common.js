/**
 * XadillaX created at 2014-09-25 11:26
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
/**
 * order array to object
 * @param order
 * @returns {Mixed|*}
 */
exports.orderArrayToObject = function(order) {
    return this.orderStringToObject(order.join(","));
};

/**
 * order string to object
 * @param order
 * @returns {Mixed|*}
 */
exports.orderStringToObject = function(order) {
    var array = order.split(",").compact().map(function(_order) {
        _order = _order.trim().split(" ").compact();
        if(_order.length !== 2) {
            return undefined;
        }

        _order[1] = _order[1].toUpperCase();
        if(_order[1] !== "ASC" && _order[1] !== "DESC") {
            return undefined;
        }

        var res = {};
        res[_order[0]] = _order[1];
        return res;
    }).compact();

    // [ { a: "ASC" }, { b: "DESC" } ]
    //   ->
    // { a: "ASC", b: "DESC" }
    var result = array.reduce(function(ans, obj) {
        Object.merge(ans, obj);
        return ans;
    }, {});

    return result;
};

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;

/**
 * get param names for a function
 * @param {Function} func the function which will be parsed
 * @return {Array} the param names
 */
exports.getParamNames = function(func) {
  var fnStr = func.toString().replace(STRIP_COMMENTS, "");
  var result = fnStr.slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")")).match(ARGUMENT_NAMES);
  if(result === null) result = [];
  return result;
};

