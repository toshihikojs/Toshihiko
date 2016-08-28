/**
 * XadillaX created at 2016-08-08 17:04:12 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const _ = require("lodash");
const cu = require("config.util");
const debug = require("debug")("toshihiko:adapter:mysql");

const Adapter = require("./base");
const escaper = require("../../util/escaper");

const FIELD_LOGICS = {
    "$eq": "=",
    "===": "=",
    "$neq": "!=",
    "!==": "!=",
    "$lt": "<",
    "<": "<",
    "$gt": ">",
    ">": ">",
    "$lte": "<=",
    "$gte": ">=",
    "$like": "LIKE",
    "$in": "IN"
};

function onConnection() {
    this.emit("log", "A new MySQL connection from Toshihiko is set. ⁽⁽ଘ( ˙꒳˙ )ଓ⁾⁾");
}

function _loadOrigin(name) {
    const mysql = require(name);

    Object.defineProperty(this, "package", {
        configurable: false,
        writable: false,
        enumerable: true,
        value: name
    });

    Object.defineProperty(this, "format", {
        configurable: false,
        writable: false,
        enumerable: true,
        value: mysql.format.bind(mysql)
    });

    return mysql;
}

class MySQLAdapter extends Adapter {
    constructor(parent, options) {
        super(parent, options);

        this.options = cu.extendDeep({}, {
            username: "",
            password: "",
            database: "toshihiko",
            host: "localhost",
            port: 3306
        }, this.options);

        const PASSWORD = this.options.password;
        Object.defineProperties(this, {
            username: {
                value: this.options.username,
                enumerable: true
            },
            database: {
                value: this.options.database,
                enumerable: true
            }
        });

        delete this.options.username;
        delete this.options.database;
        delete this.options.password;

        const opt = cu.extendDeep({}, this.options, {
            user: this.username,
            database: this.database,
            password: PASSWORD
        });

        // try to require mysql adapter
        let mysql;
        const loadOrigin = _loadOrigin.bind(this);
        if(!this.options.package) {
            try {
                mysql = loadOrigin("mysql2");
            } catch(e) {
                debug("fallback to use mysql.");
                mysql = loadOrigin("mysql");
            }
        } else {
            debug(`use package "${this.options.package}" as adapter`);
            mysql = loadOrigin(this.options.package);
        }

        Object.defineProperty(this, "mysql", {
            value: mysql.createPool(opt),

            enumerable: false,
            writable: false,
            configurable: false
        });

        // let mysql be compatibility with Toshihiko version 0.x
        // set toshihiko.pool when using mysql
        Object.defineProperty(parent, "pool", {
            configurable: true,
            enumerable: false,
            get: () => this.mysql
        });

        this.mysql.on("connection", onConnection.bind(this));

        debug("created.", this);
    }

    makeFieldWhere(model, key, condition, logic) {
        /**
         * CAUTION:
         *
         * if field type is NOT NEED QUOTES
         *
         * type author should escape SQL in `restore()` by themselves
         */

        logic = logic.toUpperCase() === "OR" ? "OR" : "AND";
        const field = model.fieldNamesMap[key];
        if(!field) {
            throw new Error(`no field named "${key}" in model "${model.name}"`);
        }

        // { foo: 1 }
        //
        // =>
        //
        // FOO = 1
        if(typeof condition !== "object") {
            condition = field.restore(condition);
            let sql = `\`${field.column}\` = `;
            if(field.type.needQuotes) {
                sql += `"${escaper.escape(condition)}"`;
            } else {
                sql += condition;
            }
            return sql;
        }

        if(condition === null) {
            return `\`${field.column}\` IS NULL`;
        }

        let redundant = false;
        const fragments = [];
        Object.keys(condition).forEach(fieldLogic => {
            if(redundant) return;

            fieldLogic = fieldLogic.toLowerCase();
            let fragCond = condition[fieldLogic];
            switch(fieldLogic) {
                case "$and":
                case "$or": {
                    // using array
                    //   eg. { $or: [ a, b, c ] }
                    if(!Array.isArray(fragCond)) {
                        fragCond = [ fragCond ];
                    }
                    fieldLogic = fieldLogic === "$and" ? "AND" : "OR";
                    const temp = fragCond.map(value => this.makeFieldWhere(model, key, value, fieldLogic));
                    let sql = temp.join(` ${fieldLogic} `);
                    if(temp.length > 1) sql = `(${sql})`;
                    fragments.push(sql);
                    break;
                }

                case "$eq":
                case "===":
                case "$neq":
                case "!==":
                case "$lt":
                case "<":
                case "$gt":
                case ">":
                case "$lte":
                case "<=":
                case "$gte":
                case ">=":
                case "$like":
                case "$in": {
                    const symbol = FIELD_LOGICS[fieldLogic];

                    // regard `IN` as special
                    if("IN" === symbol) {
                        let sql = `\`${field.column}\` IN `;
                        let seg = fragCond.map(value => field.restore(value));
                        debug(`○ ${field.column} =>`, seg);

                        if(field.type.needQuotes) {
                            seg = seg.map(value => `"${escaper.escape(value)}"`);
                        }

                        debug(`❤ ${field.column} =>`, seg);
                        sql += `(${seg.join(", ")})`;
                        fragments.push(sql);
                        break;
                    }

                    let and = [];
                    let or = [];

                    if(fragCond !== null && typeof fragCond === "object" && (fragCond.$or || fragCond.$and)) {
                        // logic object
                        //   eg. { $eq: { $or: [ 1, 2, 3 ] } }
                        if(fragCond.$and) {
                            and = fragCond.$and;
                        }

                        if(fragCond.$or) {
                            or = fragCond.$or;
                        }
                    } else {
                        // using array
                        //   eg. { $neq: [ 1, 2, 3 ] }
                        if(!Array.isArray(fragCond)) {
                            fragCond = [ fragCond ];
                        }

                        and = fragCond;
                    }

                    const closure = value => {
                        if((symbol === "=" || symbol === "!=") && value === null) {
                            return `\`${field.column}\` IS ${symbol === "=" ? "NULL" : "NOT NULL"}`;
                        }

                        value = field.restore(value);
                        debug(`○ ${field.column} =>`, value);

                        if(field.type.needQuotes) value = `("${escaper.escape(value)}")`;
                        debug(`❤ ${field.column} =>`, value);
                        return `\`${field.column}\` ${symbol} ${value}`;
                    };
                    const andSeg = and.map(closure);
                    const orSeg = or.map(closure);

                    let andSql = andSeg.join(" AND ");
                    if(andSeg.length > 1) andSql = `(${andSql})`;
                    let orSql = orSeg.join(" OR ");
                    if(orSeg.length > 1) orSql = `(${orSql})`;

                    let sql = (andSeg.length && orSeg.length) ?
                        `(${andSql} AND ${orSql})` :
                        (andSeg.length ?
                            andSql :
                            orSql);
                    fragments.push(sql);

                    break;
                }

                default: redundant = true; break;
            }
        });

        // not redundant condition data with correct logic conditions
        if(!redundant && fragments.length) {
            let sql = fragments.join(` ${logic} `);
            if(fragments.length > 1) sql = `(${sql})`;
            return sql;
        }

        // if condition is an object but not something like
        // $eq, $neq, $like, ...
        //
        // we regard it as something like { foo: new Date() }
        condition = field.restore(condition);
        debug(`${field.column} => ${condition}`);
        let sql = `\`${field.column}\` = `;
        if(field.type.needQuotes) {
            sql += `"${escaper.escape(condition)}"`;
        } else {
            sql += condition;
        }

        return sql;
    }

    makeArrayWhere(model, condition, logic) {
        if(!Array.isArray(condition)) {
            throw new Error("Non-array condition.");
        }

        logic = logic.toUpperCase() === "OR" ? "OR" : "AND";
        return `(${condition.map(cond => this.makeWhere(model, cond, "AND")).join(` ${logic} `)})`;
    }

    makeWhere(model, condition, logic) {
        logic = (logic || "AND").toUpperCase() === "OR" ? "OR" : "AND";

        if(Array.isArray(condition)) {
            return this.makeArrayWhere(model, condition, logic);
        }

        // SQL fragment variable
        const fragments = [];
        Object.keys(condition).forEach(key => {
            const fragCond = condition[key];
            switch(key) {
                /**
                 * + { $and: { foo: 1, bar: 2 } }
                 * + { $and: [ { foo: 1 }, { bar: 2 } ] }
                 */
                case "$and":
                case "$or": {
                    if(!Array.isArray(fragCond)) {
                        fragments.push(this.makeWhere(model, fragCond, key.substr(1)));
                    } else {
                        fragments.push(this.makeArrayWhere(model, fragCond, key.substr(1)));
                    }
                    break;
                }

                /**
                 * { key1: 1, key2: { $neq: 2 } }
                 */
                default: fragments.push(this.makeFieldWhere(model, key, fragCond, logic)); break;
            }
        });

        // piecing together fragments
        //
        // fragments: [ "`FOO` = 1", "(`BAR` = 2 OR `BAZ` = 3" ]
        // logic: AND
        //
        // =>
        //
        // (`FOO` = 1 AND (`BAR` = 2 OR `BAZ` = 3))
        return `(${fragments.join(` ${logic} `)})`;
    }

    makeOrder(model, order) {
        order = _.compact(order.map(o => {
            const key = Object.keys(o)[0];
            if(!key) return null;
            const field = model.fieldNamesMap[key];
            if(!field) {
                throw new Error(`no field named "${key}" in model "${model.name}"`);
            }

            return `\`${field.column}\` ${o[key] > 0 ? "ASC" : "DESC"}`;
        }));
        if(!order.length) return "";

        return order.join(", ");
    }

    makeLimit(model, limit) {
        return limit.map(l => parseInt(l) || 0).join(", ");
    }

    makeFind(model, options) {
        let fields = options.fields;
        if(!fields || !fields.length) {
            fields = null;
        }

        let sql = "SELECT ";
        sql += options.count ?
            "COUNT(0)" :
            fields ?
                _.compact(fields.map(field => `\`${model.nameToColumn[field]}\``)).join(", ") :
                "*";
        sql += ` FROM \`${model.name}\``;

        if(options.where && Object.keys(options.where)) {
            const where = this.makeWhere(model, options.where);
            if(where) {
                sql += ` WHERE ${where}`;
            }
        }

        if(options.order && options.order.length) {
            const order = this.makeOrder(model, options.order);
            if(order) {
                sql += ` ORDER BY ${order}`;
            }
        }

        if(options.limit && options.limit.length) {
            const limit = this.makeLimit(model, options.limit);
            if(limit) {
                sql += ` LIMIT ${limit}`;
            }
        }

        return sql;
    }

    makeSql(type, model, options) {
        switch(type) {
            case "find": return this.makeFind(model, options);
            default: return this.makeFind(model, options);
        }
    }

    findWithNoCache(query, callback, options) {
        const _options = cu.extendDeep({}, {
            fields: query._fields,
            where: query._where,
            order: query._order,
            limit: query._limit
        }, options);

        const sql = this.makeSql("find", query.model, _options);
        this.execute(sql, function(err, rows) {
            if(err) {
                return callback(err, undefined, sql);
            }

            return callback(undefined, rows, sql);
        });
    }

    find(query, callback, options) {
        // if no cache detected
        if(!query.cache) {
            return this.findWithNoCache(query, callback, options);
        }

        // const _options = cu.extendDeep({}, {
        //     fields: query._fields,
        //     where: query._where,
        //     order: query._order,
        //     limit: query._limit
        // }, options);
    }

    execute(sql, params, callback) {
        if(typeof params === "function") {
            callback = params;
            params = undefined;
        }

        this.mysql.getConnection((err, conn) => {
            if(err) return callback(err);

            if(params && params.length) {
                sql = this.format(sql, params);
            }

            debug(`executing sql 【${sql}】`);
            conn.query(sql, function(err, rows) {
                conn.release();
                callback(err, rows);
            });
        });
    }
}

module.exports = MySQLAdapter;
