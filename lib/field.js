/**
 * XadillaX created at 2014-09-05 18:27
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var fieldTypes = require("./fieldType");

/**
 * Toshihiko Field
 * @param opt { name: required, alias: non-required, type: non-required, primariKey: non-required, defaultValue: non-required }
 * @constructor
 */
var Field = function(opt) {
    if(!opt.name) {
        throw new Error("No field name specified");
    }

    this.originalOpt = opt;

    this.name = opt.name;
    this.alias = opt.alias || this.name;
    this.type = opt.type || fieldTypes.String;

    this.primaryKey = !!opt.primaryKey;

    this.defaultValue = (opt.defaultValue === undefined) ? this.type.defaultValue : opt.defaultValue;
};

/**
 * restore a value to original value
 * @param value
 */
Field.prototype.restore = function(value) {
    return this.type.restore(value);
};

/**
 * parse a value to parsed value
 * @param value
 */
Field.prototype.parse = function(value) {
    return this.type.parse(value);
};

module.exports = Field;
