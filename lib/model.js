/**
 * XadillaX created at 2014-09-05 18:15
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var sugar = require("sugar");
var Field = require("field");

/**
 * Toshihiko Model
 * @param fields
 * @param options
 * @constructor
 */
var Model = function(fields, options) {
    var self = this;

    this.primaryKeys = [];

    this._fields = fields;
    this._fieldsObject = fields.map(function(field) {
        var f = new Field(field);
        if(f.primaryKey) self.primaryKeys.push(f);

        return f;
    });
};

module.exports = Model;
