/**
 * XadillaX created at 2016-08-08 17:04:12 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const _ = require("lodash");
const async = require("async");
const cu = require("config.util");
const debug = require("debug")("toshihiko:adapter:mysql");
const Scarlet = require("scarlet-task");
const SqlString = require("sqlstring");
const SqlParser = require("toshihiko-mysqlparser");

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

    getDBName() {
        return this.database;
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

    makeSet(model, update) {
        let pattern = "";
        let params = [];

        for(let key in update) {
            if(!update.hasOwnProperty(key)) continue;
            if(pattern !== "") pattern += ", ";

            const value = update[key];
            const field = model.fieldNamesMap[key];
            if(!field) continue;

            pattern += `\`${field.column}\` = `;

            // judge raw data, eg.
            //   {{i + 1}}
            if(typeof value === "string" && value.length >= 4 &&
                value[0] === "{" && value[1] === "{" &&
                value[value.length - 1] === "}" && value[value.length - 2] === "}") {
                pattern += SqlParser.sqlNameToColumn(value.substr(2, value.length - 4), model.nameToColumn);
            } else {
                if(!field.needQuotes) {
                    pattern += `${escaper.escape(field.restore(value))}`;
                } else {
                    pattern += "?";
                    params.push(field.restore(value));
                }
            }
        }

        return this.format(pattern, params);
    }

    makeFind(model, options) {
        options = options || {};

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

        if(options.where && Object.keys(options.where).length) {
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

    makeUpdate(model, options) {
        options = options || {};
        const set = this.makeSet(model, options.update);
        if(!set) throw new Error("no set data.");
        let sql = `UPDATE \`${model.name}\` SET ${set}`;

        if(options.where && Object.keys(options.where).length) {
            const where = this.makeWhere(model, options.where);
            if(where) {
                sql += ` WHERE ${where}`;
            }
        }

        return sql;
    }

    makeSql(type, model, options) {
        switch(type) {
            case "find": return this.makeFind(model, options);
            case "update": return this.makeUpdate(model, options);
            default: return this.makeFind(model, options);
        }
    }

    findWithNoCache(model, callback, options) {
        const sql = this.makeSql("find", model, options);
        this.execute(sql, function(err, rows) {
            if(err) {
                return callback(err, undefined, sql);
            } 

            if(options.single) {
                return callback(undefined, (rows || []).length ? rows[0] : null, sql);
            }

            return callback(undefined, (rows || []), sql);
        });
    }

    findWithCache(cache, model, callback, options) {
        const self = this;
        const primaryKeys = model.primaryKeys.map(field => field.name);
        const origFields = _.uniq((options.fields || []).concat(primaryKeys));

        // search for primary keys
        options.fields = primaryKeys;
        const pkSQL = this.makeSql("find", model, options);
        this.execute(pkSQL, function(err, rows) {
            if(err) {
                options.fields = origFields;
                return callback(err, undefined, self.makeSql("find", model, options));
            }

            // get data from cache first
            cache.getData(self.database, model.name, rows, function(err, data) {
                if(err) data = [];

                let uncachedCount = 0;
                const result = [];
                const errors = [];

                function fetchFromMySQL(taskObject) {
                    const idx = taskObject.task;
                    const sql = self.makeSql("find", model, {
                        where: model.convertColumnToName(rows[idx]),
                        limit: [ 0, 1 ]
                    });

                    self.execute(sql, function(err, row) {
                        if(err) {
                            errors.push(err);
                            return taskObject.done();
                        }

                        if(!row || !row.length) {
                            return taskObject.done();
                        }

                        row = row[0];

                        // insert this uncached data to cache
                        // and also insert it to result
                        cache.setData(self.database, model.name, rows[idx], row, function() {
                            // no matter insert succesfully or not

                            result[idx] = row;
                            taskObject.done();
                        });
                    });
                }

                const scarlet = new Scarlet(10);

                // push cached data or uncached undefined into result
                for(let i = 0; i < rows.length; i++) {
                    const row = _.find(data, v => { // jshint ignore: line
                        for(let key in rows[i]) {
                            if(rows[i][key] !== v[key]) return false;
                        }
                        return true;
                    });

                    if(undefined !== row) {
                        row.$fromCache = true;
                        result.push(row);
                    } else {
                        uncachedCount++;
                        result.push(undefined);
                        scarlet.push(i, fetchFromMySQL);
                    }
                }

                if(!uncachedCount) {
                    done();
                } else {
                    scarlet.afterFinish(uncachedCount, done, false);
                }

                function done() {
                    const err = errors.length ? errors[0] : undefined;

                    // delete some keys to fit query.field
                    const delKeys = [];
                    for(let i = 0; i < model.schema.length; i++) {
                        if(origFields.indexOf(model.schema[i].name) === -1) {
                            delKeys.push(model.schema[i].column);
                        }
                    }

                    const liteResult = _.compact(result).map(row => {
                        delKeys.forEach(key => delete row[key]);
                        return row;
                    });

                    options.fields = origFields;
                    const extraSql = self.makeSql("find", model, options);
                    return callback(err, liteResult, extraSql);
                }
            });
        });
    }

    queryToOptions(query, options) {
        const _options = cu.extendDeep({}, {
            fields: query._fields,
            where: query._where,
            order: query._order,
            limit: query._limit,
            update: query._updateData
        }, options || {});

        if(_options.single) {
            if(!_options.limit || !_options.limit.length) {
                _options.limit = [ 0, 1 ];
            } else if(_options.limit.length === 1) {
                _options.limit[0] = 1;
            } else {
                _options.limit[1] = 1;
            }
        }

        return _options;
    }

    find(query, callback, options) {
        const _options = this.queryToOptions(query, options);
        if(!query.cache || options.noCache) {
            return this.findWithNoCache(query.model, callback, _options);
        } else {
            return this.findWithCache(query.cache, query.model, callback, _options);
        }
    }

    updateByQuery(query, callback) {
        const self = this;
        const options = this.queryToOptions(query);
        const sql = this.makeSql("update", query.model, options);
        const model = query.model;

        let primaryKeys;
        async.waterfall([
            function(callback) {
                if(!model.cache) {
                    return callback();
                }

                // delete related rows if using cache
                const tempFields = options.fields;
                primaryKeys = model.primaryKeys.map(key => key.name);
                options.fields = primaryKeys;

                const relatedSql = self.makeSql("find", query.model, options);
                debug("find related rows when updating", relatedSql);
                self.execute(relatedSql, function(err, result) {
                    if(err) return callback(err);
                    model.cache.deleteKeys(self.getDBName(), model.name, result, function(err) {
                        options.fields = tempFields;
                        callback(err);
                    });
                });
            },

            function(callback) {
                debug("update data by query", sql);
                self.execute(sql, callback);
            }
        ], function(err, result) {
            if(err === null) err = undefined;
            callback(err, result, sql);
        });
    }

    insert(model, _data, callback) {
        // let it be
        // [ { field: foo, value: bar }, ... ]
        //
        // we consume it as D
        const data = Object.keys(_data).reduce((data, key) => {
            if(!_data.hasOwnProperty(key)) return data;
            if(key.length && key[0] === "$") return data;
            const field = model.fieldNamesMap[key];
            if(undefined === field) return data;

            data.push({
                field: field,
                value: (_data[key] === null) ? null : field.restore(_data[key])
            });
            return data;
        }, []);

        // fill D into sql string
        //
        // INSERT INTO `name` SET =>
        //
        // 1. needQuote: `column` = SqlString.escape(value)
        // 2. !needQuote: `column` = value
        const _set = data.reduce((_set, data) => {
            if(data.value === null) {
                _set.push(`\`${data.field.column}\` = NULL`);
            } else if(data.field.needQuotes) {
                _set.push(`\`${data.field.column}\` = ${SqlString.escape(data.value)}`);
            } else {
                _set.push(`\`${data.field.column}\` = ${data.value}`);
            }
            return _set;
        }, []);

        const sql = `INSERT INTO \`${model.name}\` SET ${_set.join(", ")}`;
        this.execute(sql, function(err, row) {
            if(err) return callback(err, undefined, sql);
            if(!row) {
                return callback(new Error("no row inserted."), undefined, sql);
            }

            let where = {};
            const primaryKeys = model.primaryKeys;
            const autoIncrement = model.ai;

            // query the instance from database now
            if(row.insertId) {
                // if this row has an auto increament id
               
                if(primaryKeys.length === 1) {
                    // if we have only one primary key
                    //
                    // 1. no AI specified in model: consume primary is AI in database, use AI as primary key to query
                    // 2. primary key is AI: use AI as primary key to query
                    // 3. primary key is not AI: use primary key to query
                    
                    if(!autoIncrement || autoIncrement.primaryKey) {
                        where[primaryKeys[0].name] = row.insertId;
                    } else {
                        where[primaryKeys[0].name] = _data[primaryKeys[0].name];
                    }
                } else if(primaryKeys.length) {
                    // if we have several primay keys
                    //
                    // step 1.
                    //   use all primary keys to query
                    //
                    // step 2. (only have auto increament key)
                    //   overwrite the AI to the certain primary key
                   
                    // --> step 1.
                    for(let i = 0; i < primaryKeys.length; i++) {
                        where[primaryKeys[i].name] = _data[primaryKeys[i].name];
                    }

                    // --> step 2.
                    if(autoIncrement && autoIncrement.primaryKey) {
                        where[autoIncrement.name] = row.insertId;
                    }
                } else {
                    // if we have no primary key
                    //
                    // 1. console a warning to tell developer it's dangrous
                    // 2. use all columns to query

                    // fill all fields and console warning
                    console.error("[TOSHIHIKO WARNING] no primary key while inserting may cause some problems!");
                    where = _data;

                    if(autoIncrement) {
                        where[autoIncrement.name] = row.insertId;
                    }
                }
            } else {
                // no auto increament id in row

                if(!primaryKeys.length) {
                    // no primary key
                    
                    where = _data;
                } else {
                    // has primary key(s)
                    
                    for(let i = 0; i < primaryKeys.length; i++) {
                        where[primaryKeys[i].name] = _data[primaryKeys[i].name];
                    }
                }
            }

            model.where(where).findOne(function(err, row) {
                if(err) {
                    return callback(err, undefined, sql);
                }

                if(!row) {
                    return callback(new Error("insert successfully but failed to read the record."), undefined, sql);
                }

                return callback(undefined, row, sql);
            });
        });
    }

    execute(sql, params, callback) {
        if(typeof params === "function") {
            callback = params;
            params = undefined;
        }

        this.mysql.getConnection((err, conn) => {
            if(err) return callback(err);

            if(params && (params.length || !Array.isArray(params))) {
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
