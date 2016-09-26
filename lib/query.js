/**
 * XadillaX created at 2016-08-11 14:23:10 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const _ = require("lodash");

const Yukari = require("./yukari");

const emptyFunc = function() {};

class ToshihikoQuery {
    constructor(model) {
        Object.defineProperties(this, {
            toshihiko: { value: model.parent },
            adapter: { value: model.parent.adapter },
            model: { value: model },
            cache: { value: model.cache }
        });

        this._fields = this.model.schema.map(field => field.name); 
        this._limit = [];
        this._order = [];
        this._updateData = {};
        this._where = {};

        Object.defineProperties(this, {
            // alias for fields, to be compatible
            field: { value: this.fields, writable: true },

            // alias for order, to be compatible
            orderBy: { value: this.order, writable: true }
        });
    }

    where(condition) {
        if(typeof condition !== "object") {
            throw new Error(`query condition expected to be an object but got ${typeof condition} ${condition}.`);
        }

        this._where = condition;
        return this;
    }

    fields(fields) {
        if(typeof fields === "string") {
            // 'foo,bar, baz, ...'
            fields = _.compact(fields.split(",").map(field => field.trim()));
        }

        if(!Array.isArray(fields)) {
            throw new Error(`query fields expected to be an array or string but got ${typeof fields} ${fields}.`);
        }

        this._fields = fields;
        return this;
    }

    limit(limit) {
        /**
         * limit
         *   - []: no limit
         *   - [ foo ]: `foo` rows
         *   - [ foo, bar ]: `bar` rows with offset `foo`
         */

        if(arguments.length >= 2) {
            this._limit = [ parseInt(arguments[0]) || 0, parseInt(arguments[1]) || 0 ];
            return this;
        } else if(typeof limit === "number") {
            this._limit = [ limit ];
            return this;
        } else if(typeof limit === "string") {
            if(limit.trim() !== "") {
                limit = limit.split(",");
            } else {
                limit = [];
            }
        }

        if(!Array.isArray(limit)) {
            throw new Error(`query limit expected to be an array, number or string but got ${typeof limit} ${limit}.`);
        }

        if(limit.length > 2) limit = [ limit[0], limit[1] ];

        this._limit = limit.map(limit => parseInt(limit) || 0);
        return this;
    }

    order(order) {
        /**
         * order
         *   - object
         *     - { foo: 1, bar: -1 }
         *     - { foo: "asc", bar: "desc" }
         *   - array
         *     - [ "foo asc", "bar desc" ]
         *     - [ { foo: 1 }, { bar: "desc" } ]
         *   - string
         *     - "foo, bar desc"
         */
        
        if(typeof order === "string") {
            order = _.compact(order.split(",").map(order => {
                const result = {};

                order = _.compact(order.split(" "));
                if(!order.length) return null;
                result[order[0].trim()] = ((order[1] || "ASC").trim().toUpperCase() === "ASC") ? 1 : -1;
                return result;
            }));
        } else if(Array.isArray(order)) {
            order = order.map(order => {
                const result = {};

                if(typeof order === "string") {
                    order = order.split(" ");
                    result[order[0].trim()] = ((order[1] || "ASC").trim().toUpperCase() === "ASC") ? 1 : -1;
                    return result;
                }

                Object.keys(order).forEach(key => {
                    result[key.trim()] = (typeof order[key] === "number") ?
                        order[key] :
                        (order[key].toUpperCase() === "ASC" ? 1 : -1);
                });
                return result;
            });
        } else {
            order = Object.keys(order).map(key => {
                const result = {};
                result[key.trim()] = (typeof order[key] === "number") ?
                    order[key] :
                    (order[key].toUpperCase() === "ASC" ? 1 : -1);
                return result;
            });
        }

        this._order = order;
        return this;
    }

    find(callback, toJSON, options) {
        if(typeof toJSON === "object") {
            options = toJSON;
            toJSON = false;
        }
        options = options || {};
        if(undefined === callback) callback = emptyFunc;

        const self = this;
        this.adapter.find(this, function(err, row, extra) {
            if(options.single && row) {
                if(row instanceof Yukari && toJSON) {
                    row = row.toJSON();
                } else if(!(row instanceof Yukari)) {
                    const yukari = new Yukari(self.model, "query");
                    yukari.fillRowFromSource(row, true);
                    row = toJSON ? yukari.toJSON() : yukari;
                }
            } else if(!options.single) {
                if(row && row.length) {
                    row = row.map(row => {
                        if(row instanceof Yukari) return toJSON ? row.toJSON() : row;

                        const yukari = new Yukari(self.model, "query");
                        yukari.fillRowFromSource(row, true);
                        return toJSON ? yukari.toJSON() : yukari;
                    });
                }
            }

            return callback(err, row, extra);
        }, {
            single: !!options.single,
            noCache: !!options.noCache
        });
    }

    findOne(callback, toJSON) {
        this.find(callback, toJSON, { single: true });
    }

    update(data, callback) {
        if(undefined === callback) callback = emptyFunc;
        this._updateData = data;

        this.adapter.updateByQuery(this, function(err, result, extra) {
            return callback(err, result, extra);
        });
    }
}

module.exports = ToshihikoQuery;
