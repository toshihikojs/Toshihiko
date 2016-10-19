/**
 * XadillaX created at 2016-08-08 17:04:12 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const _ = require("lodash");
const async = require("async");
const debug = require("debug")("toshihiko:adapter:mysql");
const Scarlet = require("scarlet-task");
const SqlString = require("sqlstring");
const SqlParser = require("toshihiko-mysqlparser");

const Adapter = require("./base");
const common = require("../../util/common");
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

/**
 * on connection event
 */
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
    /**
     * MySQL Adapter
     * @param {Toshihiko} parent the parent toshihiko object
     * @param {Object} options the options object
     */
    constructor(parent, options) {
        super(parent, options);

        this.options = common.extend({
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

        try {
            delete this.options.username;
            delete this.options.database;
            delete this.options.password;
        } catch(e) {
            // delete may occur error:
            //   not existing
            //   frozen
        }

        const opt = common.extend(this.options, {
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

    /**
     * get database name
     * @returns {String} the database name
     */
    getDBName() {
        return this.database;
    }

    /**
     * make where segment with field kv pair
     * @param {ToshihikoModel} model the model object
     * @param {String} key the field name
     * @param {*} condition field condition
     * @param {String} [logic] the segment logic. AND|OR
     * @returns {String} made segment
     */
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

    /**
     * make where segment with array
     * @param {ToshihikoModel} model the model object
     * @param {Array} condition the condition object
     * @param {String} [logic] the segment logic. AND|OR
     * @returns {String} made segment
     */
    makeArrayWhere(model, condition, logic) {
        if(!Array.isArray(condition)) {
            throw new Error("Non-array condition.");
        }

        logic = logic.toUpperCase() === "OR" ? "OR" : "AND";
        return `(${condition.map(cond => this.makeWhere(model, cond, "AND")).join(` ${logic} `)})`;
    }

    /**
     * make where segment
     * @param {ToshihikoModel} model the toshihiko model object
     * @param {Object} condition the condition object
     * @param {String} [logic] the segment logic. AND|OR
     * @returns {String} made segment
     */
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

    /**
     * make order segment
     * @param {ToshihikoModel} model the toshihiko model object
     * @param {Array} order the order array
     * @returns {String} made segment
     */
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

    /**
     * make limit segment
     * @param {ToshihikoModel} model the toshihiko model object
     * @param {Array} limit the limit array
     * @returns {String} made segment
     */
    makeLimit(model, limit) {
        return limit.map(l => parseInt(l) || 0).join(", ");
    }

    /**
     * make force index segment
     * @param {ToshihikoModel} model the toshihiko model object
     * @param {String} index the index key name
     * @returns {String} made segment
     */
    makeIndex(model, index) {
        if(!index) return "";
        return `FORCE INDEX(\`${index}\`)`;
    }

    /**
     * make sql of SET
     * @param {ToshihikoModel} model the toshihiko model
     * @param {Object} update the update data
     * @returns {String} made SQL
     */
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

    /**
     * make sql of SELECT
     * @param {ToshihikoModel} model the toshihiko model object
     * @param {Object} [options] the SELECT options
     * @returns {String} made SQL
     */
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

        if(options.index) {
            const index = this.makeIndex(model, options.index);
            if(index) {
                sql += ` ${index}`;
            }
        }

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

    /**
     * make sql of UPDATE
     * @param {ToshihikoModel} model the toshihiko model
     * @param {Object} options the UPDATE options
     * @returns {String} made SQL
     */
    makeUpdate(model, options) {
        options = options || {};
        const set = this.makeSet(model, options.update);
        if(!set) throw new Error("no set data.");
        let sql = `UPDATE \`${model.name}\``;

        if(options.index) {
            const index = this.makeIndex(model, options.index);
            if(index) {
                sql += ` ${index}`;
            }
        }
        
        sql += ` SET ${set}`;

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

    /**
     * make sql of DELETE
     * @param {ToshihikoModel} model the toshihiko model
     * @param {Object} options the DELETE options
     * @returns {String} made SQL
     */
    makeDelete(model, options) {
        options = options || {};
        let sql = `DELETE FROM \`${model.name}\``;

        // http://stackoverflow.com/questions/2924671/mysql-delete-and-index-hint#answer-2924738
        //
        // `FORCE INDEX` is not for deletes

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

    /**
     * make SQL
     * @param {String} type sql type. find|count|update|delete
     * @param {ToshihikoModel} model the toshihiko model object
     * @param {Object} options sql options
     * @returns {String} made sql
     */
    makeSql(type, model, options) {
        if(type === "count") {
            options.count = true;
        }

        switch(type) {
            case "find": return this.makeFind(model, options);
            case "count": return this.makeFind(model, options);
            case "update": return this.makeUpdate(model, options);
            case "delete": return this.makeDelete(model, options);
            default: return this.makeFind(model, options);
        }
    }

    /**
     * find records with no cache
     * @param {ToshihikoModel} model the toshihiko model
     * @param {Function} callback the callback function
     * @param {Object} options the options
     */
    findWithNoCache(model, callback, options) {
        let sql;
        try {
            sql = this.makeSql("find", model, options);
        } catch(e) {
            return process.nextTick(function() {
                callback(e);
            });
        }
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

    /**
     * find records with cache
     * @param {ToshihikoCache} cache the cache object
     * @param {ToshihikoModel} model the toshihiko model
     * @param {Function} callback the callback function
     * @param {Object} options the options
     */
    findWithCache(cache, model, callback, options) {
        options = options || {};
        const self = this;
        const primaryKeys = model.primaryKeys.map(field => field.name);
        const totalFields = model.schema.map(field => field.name);
        const origFields = _.uniq((options.fields || totalFields).concat(primaryKeys));

        // search for primary keys
        options.fields = primaryKeys;
        let pkSQL;
        try {
            pkSQL = this.makeSql("find", model, options);
        } catch(e) {
            return process.nextTick(function() {
                return callback(e, undefined, "");
            });
        }
        this.execute(pkSQL, function(err, rows) {
            if(err) {
                options.fields = origFields;
                let sql;
                try {
                    sql = self.makeSql("find", model, options);
                } catch(e) {
                    return callback(e, undefined, "");
                }
                return callback(err, undefined, sql);
            }

            // get data from cache first
            cache.getData(self.database, model.name, rows, function(err, data) {
                if(err) data = [];

                let uncachedCount = 0;
                const result = [];
                const errors = [];

                function fetchFromMySQL(taskObject) {
                    const idx = taskObject.task;

                    let sql;
                    try {
                        sql = self.makeSql("find", model, {
                            where: model.convertColumnToName(rows[idx]),
                            limit: [ 0, 1 ],
                            fields: totalFields
                        });
                    } catch(e) {
                        errors.push(e);
                        return taskObject.done();
                    }

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
                    let extraSql;
                    try {
                        extraSql = self.makeSql("find", model, options);
                    } catch(e) {
                        return process.nextTick(function() {
                            return callback(e);
                        });
                    }

                    if(options.single) {
                        return callback(err, liteResult.length ? liteResult[0] : null, extraSql);
                    }

                    return callback(err, liteResult, extraSql);
                }
            });
        });
    }

    /**
     * make query to options
     * @param {ToshihikoQuery} query the toshihiko query object
     * @param {Object} [options] the existing options object
     * @returns {Object} made options
     */
    queryToOptions(query, options) {
        const _options = common.extend({
            fields: query._fields,
            where: query._where,
            order: query._order,
            limit: query._limit,
            update: query._updateData,
            index: query._index
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

    /**
     * count a condition
     * @param {ToshihikoQuery} query the toshihiko query object
     * @param {Function} callback the callback function
     */
    count(query, callback) {
        const _options = this.queryToOptions(query, {});
        const sql = this.makeSql("count", query.model, _options);
        this.execute(sql, function(err, rows) {
            if(err) return callback(err, undefined, sql);
            return callback(undefined, (rows || [ { "COUNT(0)": 0 } ])[0]["COUNT(0)"], sql);
        });
    }

    /**
     * find with a condition
     * @param {ToshihikoQuery} query the toshihiko query object
     * @param {Function} callback the callback function
     * @param {Object} options the find options
     */
    find(query, callback, options) {
        const _options = this.queryToOptions(query, options);
        if(!query.cache || options.noCache) {
            return this.findWithNoCache(query.model, callback, _options);
        } else {
            return this.findWithCache(query.cache, query.model, callback, _options);
        }
    }

    /**
     * update by query
     * @param {ToshihikoQuery} query the toshihiko query object
     * @param {Function} callback the callback function
     */
    updateByQuery(query, callback) {
        const self = this;
        const options = this.queryToOptions(query);
        const model = query.model;
        let sql;
        try {
            sql = this.makeSql("update", query.model, options);
        } catch(e) {
            return process.nextTick(function() {
                return callback(e);
            });
        }

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

                let relatedSql;
                try {
                    relatedSql = self.makeSql("find", query.model, options);
                } catch(e) {
                    return process.nextTick(function() {
                        callback(e);
                    });
                }
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

    /**
     * delete by query
     * @param {ToshihikoQuery} query the toshihiko query object
     * @param {Function} callback the callback function
     */
    deleteByQuery(query, callback) {
        const self = this;
        const options = this.queryToOptions(query);
        const model = query.model;
        let sql;
        try {
            sql = this.makeSql("delete", query.model, options);
        } catch(e) {
            return process.nextTick(function() {
                return callback(e);
            });
        }

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

                let relatedSql;
               
                try {
                    relatedSql = self.makeSql("find", query.model, options);
                } catch(e) {
                    return process.nextTick(function() {
                        return callback(e);
                    });
                }
                debug("find related rows when deleting", relatedSql);
                self.execute(relatedSql, function(err, result) {
                    if(err) return callback(err);
                    model.cache.deleteKeys(self.getDBName(), model.name, result, function(err) {
                        options.fields = tempFields;
                        callback(err);
                    });
                });
            },

            function(callback) {
                debug("delete data by query", sql);
                self.execute(sql, callback);
            }
        ], function(err, result) {
            if(err === null) err = undefined;
            callback(err, result, sql);
        });
    }

    /**
     * insert
     * @param {ToshihikoModel} model the toshihiko model object
     * @param {Object} data data to be inserted
     * @param {Function} callback the callback function
     */
    insert(model, data, callback) { 
        // fill data into sql string
        //
        // INSERT INTO `name` SET =>
        //
        // 1. needQuote: `column` = SqlString.escape(value)
        // 2. !needQuote: `column` = value
        const primaryValues = {};
        const _set = data.reduce((_set, data) => {
            if(data.value === null) {
                _set.push(`\`${data.field.column}\` = NULL`);
            } else if(data.field.needQuotes) {
                _set.push(`\`${data.field.column}\` = ${SqlString.escape(data.field.restore(data.value))}`);
            } else {
                _set.push(`\`${data.field.column}\` = ${data.field.restore(data.value)}`);
            }

            if(data.field.primaryKey || !model.primaryKeys.length) {
                primaryValues[data.field.name] = data.value;
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
                        where = primaryValues;
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
                    where = primaryValues;

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
                    where = primaryValues;

                    if(autoIncrement) {
                        where[autoIncrement.name] = row.insertId;
                    }
                }
            } else {
                // no auto increament id in row
                where = primaryValues;
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

    /**
     * update
     * @param {ToshihikoModel} model the toshihiko model object
     * @param {Object} pk primary key(s) of the record to be updated
     * @param {Object} data data to be updated
     * @param {Function} callback the callback function
     */
    update(model, pk, data, callback) {
        if(!pk || !data) {
            return process.nextTick(function() {
                callback(new Error("Invalid parameters."));
            });
        }

        const _set = data.reduce((_set, data) => {
            if(data.value === null) {
                _set.push(`\`${data.field.column}\` = NULL`);
            } else if(data.field.needQuotes) {
                _set.push(`\`${data.field.column}\` = ${SqlString.escape(data.field.restore(data.value))}`);
            } else {
                _set.push(`\`${data.field.column}\` = ${data.field.restore(data.value)}`);
            }

            return _set;
        }, []);
        const _updateWhere = this.makeWhere(model, pk, "and");
        if(_updateWhere === "()") {
            return process.nextTick(function() {
                callback(new Error("Broken yukari object."));
            });
        }

        if(!_set.length) {
            return process.nextTick(function() {
                callback(new Error("Broken update data information."));
            });
        }

        const self = this;
        const pkNames = model.primaryKeys.map(key => key.name);
        const sql = `UPDATE \`${model.name}\` SET ${_set.join(", ")} WHERE ${_updateWhere}`;
        async.waterfall([
            function(callback) {
                if(!model.cache) return callback();

                // delete cache if has
                let relatedSql;
                try {
                    relatedSql = self.makeSql("find", model, {
                        where: pk,
                        limit: [ 0, 1 ],
                        fields: pkNames
                    });
                } catch(e) {
                    return process.nextTick(function() {
                        callback(e);
                    });
                }
                debug("find related row when updating Yukari", relatedSql);
                self.execute(relatedSql, function(err, result) {
                    if(err) return callback(err);
                    model.cache.deleteKeys(self.getDBName(), model.name, result, function(err) {
                        return callback(err);
                    });
                });
            },

            function(callback) {
                self.execute(sql, function(err, results) {
                    if(err) return callback(err);
                    if(!results.affectedRows) {
                        return callback(new Error("Out-dated yukari data."));
                    }
                    return callback();
                });
            }
        ], function(err) {
            return callback(err, sql);
        });
    }

    /**
     * execute
     * @param {String} sql the sql pattern
     * @param {Array} [params] parameters to be filled in sql pattern
     * @param {Function} callback the callback function
     */
    execute(sql, params, callback) {
        if(typeof params === "function") {
            callback = params;
            params = undefined;
        }

        const self = this;
        this.mysql.getConnection((err, conn) => {
            if(err) return callback(err);

            if(params && (params.length || !Array.isArray(params))) {
                sql = this.format(sql, params);
            }

            debug(`executing sql 【${sql}】`);
            if(self.options.showSql) {
                console.log(`❤️ Toshihiko is executing SQL: 【${sql}】...`);
            }
            conn.query(sql, function(err, rows) {
                conn.release();
                callback(err, rows);
            });
        });
    }
}

module.exports = MySQLAdapter;
