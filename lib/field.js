/**
 * XadillaX created at 2014-09-05 18:27
 *
 * Copyright (c) 2015 Souche.com, all rights
 * reserved.
 */
"use strict";

var fieldTypes = require("./fieldType");
var util = require("util");

/**
 * Toshihiko Field
 * @param opt {
 *              name: required,
 *              column: non-required,
 *              type: non-required,
 *              primariKey: non-required,
 *              defaultValue: non-required,
 *              validators: non-required,
 *              allowNull: non-required
 *            }
 * @constructor
 */
var Field = function(opt) {
    if(!opt.name) {
        throw new Error("No field name specified");
    }

    this.originalOpt = opt;

    this.name = opt.name;
    this.column = opt.column || this.name;
    this.type = opt.type || fieldTypes.String;
    this.validators = [];
    this.allowNull = opt.allowNull || false;
    if(util.isArray(opt.validators)) {
        this.validators = opt.validators;
    } else if(typeof(opt.validators) === "function") {
        this.validators.push(opt.validators);
    }

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

