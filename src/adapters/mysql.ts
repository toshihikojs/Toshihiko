/**
 * Toshihiko - MySQL Adapter
 */

import _ from "lodash";
import async from "async";
import createDebug from "debug";
import Scarlet from "scarlet-task";
import SqlString from "sqlstring";
import SqlParser from "toshihiko-mysqlparser";

import { BaseAdapter } from "./base";
import { extend } from "../util/common";
import { escape } from "../util/escaper";
import { ObjStatic, QueryOptions, ResultCallback } from "../types";

const debug = createDebug("toshihiko:adapter:mysql");

const FIELD_LOGICS: ObjStatic = {
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
    "$in": "IN",
    "$between": "BETWEEN",
};

function onConnection(this: MySQLAdapter): void {
    this.emit("log", "A new MySQL connection from Toshihiko is set. ⁽⁽ଘ( ˙꒳˙ )ଓ⁾⁾");
}

export class MySQLAdapter extends BaseAdapter {
    public readonly username: string;
    public readonly database: string;
    public readonly mysql: any;
    public readonly format: (sql: string, params?: any[]) => string;
    public declare readonly package: string;

    constructor(parent: any, options?: ObjStatic) {
        super(parent, options);

        this.options = extend({
            username: "",
            password: "",
            database: "toshihiko",
            host: "localhost",
            port: 3306,
        }, this.options);

        if (this.options.showSql === true) {
            this.options.showSql = console.log.bind(console);
        }

        const PASSWORD = this.options.password;
        this.username = this.options.username;
        this.database = this.options.database;

        try {
            delete this.options.username;
            delete this.options.database;
            delete this.options.password;
        } catch (e) {
            // delete may occur error
        }

        const opt = extend(this.options, {
            user: this.username,
            database: this.database,
            password: PASSWORD,
        });

        // try to require mysql adapter
        let mysql: any;
        if (!this.options.package) {
            try {
                mysql = require("mysql2");
                (this as any).package = "mysql2";
            } catch (e) {
                debug("fallback to use mysql.");
                mysql = require("mysql");
                (this as any).package = "mysql";
            }
        } else {
            debug(`use package "${this.options.package}" as adapter`);
            mysql = require(this.options.package);
            (this as any).package = this.options.package;
        }

        this.format = mysql.format.bind(mysql);
        (this as any).mysql = mysql.createPool(opt);

        // let mysql be compatibility with Toshihiko version 0.x
        Object.defineProperty(parent, "pool", {
            configurable: true,
            enumerable: false,
            get: () => this.mysql,
        });

        this.mysql.on("connection", onConnection.bind(this));

        debug("created.", this);
    }

    /**
     * Get database name
     */
    getDBName(): string {
        return this.database;
    }

    /**
     * Make where segment with field kv pair
     */
    makeFieldWhere(model: any, key: string, condition: any, logic?: string): string {
        logic = (logic || "AND").toUpperCase() === "OR" ? "OR" : "AND";
        const field = model.fieldNamesMap[key];
        if (!field) {
            throw new Error(`no field named "${key}" in model "${model.name}"`);
        }

        // { foo: 1 } => FOO = 1
        if (typeof condition !== "object") {
            condition = field.restore(condition);
            let sql = `\`${field.column}\` = `;
            if (field.type.needQuotes) {
                sql += `"${escape(condition)}"`;
            } else {
                sql += condition;
            }
            return sql;
        }

        if (condition === null) {
            return `\`${field.column}\` IS NULL`;
        }

        let redundant = false;
        const fragments: string[] = [];

        Object.keys(condition).forEach((fieldLogic) => {
            if (redundant) return;

            fieldLogic = fieldLogic.toLowerCase();
            let fragCond = condition[fieldLogic];

            switch (fieldLogic) {
                case "$and":
                case "$or": {
                    if (!Array.isArray(fragCond)) {
                        fragCond = [fragCond];
                    }
                    fieldLogic = fieldLogic === "$and" ? "AND" : "OR";
                    const temp = fragCond.map((value: any) => this.makeFieldWhere(model, key, value, fieldLogic));
                    let sql = temp.join(` ${fieldLogic} `);
                    if (temp.length > 1) sql = `(${sql})`;
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
                case "$between":
                case "$in": {
                    const symbol = FIELD_LOGICS[fieldLogic];

                    if ("IN" === symbol) {
                        let sql = `\`${field.column}\` IN `;
                        let seg = fragCond.map((value: any) => field.restore(value));
                        debug(`○ ${field.column} =>`, seg);

                        if (field.type.needQuotes) {
                            seg = seg.map((value: any) => `"${escape(value)}"`);
                        }

                        debug(`❤ ${field.column} =>`, seg);
                        sql += `(${seg.join(", ")})`;
                        fragments.push(sql);
                        break;
                    } else if ("BETWEEN" === symbol) {
                        let sql = `\`${field.column}\` BETWEEN `;
                        let seg = [field.restore(fragCond[0]), field.restore(fragCond[1])];
                        debug(`○ ${field.column} => BEWTEEN`, seg);

                        if (field.type.needQuotes) {
                            seg = seg.map((value: any) => `"${escape(value)}"`);
                        }

                        debug(`❤ ${field.column} => BETWEEN`, seg);
                        sql += `${seg[0]} AND ${seg[1]}`;
                        fragments.push(sql);
                        break;
                    }

                    let and: any[] = [];
                    let or: any[] = [];

                    if (fragCond !== null && typeof fragCond === "object" && (fragCond.$or || fragCond.$and)) {
                        if (fragCond.$and) {
                            and = fragCond.$and;
                        }
                        if (fragCond.$or) {
                            or = fragCond.$or;
                        }
                    } else {
                        if (!Array.isArray(fragCond)) {
                            fragCond = [fragCond];
                        }
                        and = fragCond;
                    }

                    const closure = (value: any): string => {
                        if ((symbol === "=" || symbol === "!=") && value === null) {
                            return `\`${field.column}\` IS ${symbol === "=" ? "NULL" : "NOT NULL"}`;
                        }

                        value = field.restore(value);
                        debug(`○ ${field.column} =>`, value);

                        if (field.type.needQuotes) value = `("${escape(value)}")`;
                        debug(`❤ ${field.column} =>`, value);
                        return `\`${field.column}\` ${symbol} ${value}`;
                    };

                    const andSeg = and.map(closure);
                    const orSeg = or.map(closure);

                    let andSql = andSeg.join(" AND ");
                    if (andSeg.length > 1) andSql = `(${andSql})`;
                    let orSql = orSeg.join(" OR ");
                    if (orSeg.length > 1) orSql = `(${orSql})`;

                    let sql = (andSeg.length && orSeg.length)
                        ? `(${andSql} AND ${orSql})`
                        : (andSeg.length ? andSql : orSql);
                    fragments.push(sql);
                    break;
                }

                default:
                    redundant = true;
                    break;
            }
        });

        if (!redundant && fragments.length) {
            let sql = fragments.join(` ${logic} `);
            if (fragments.length > 1) sql = `(${sql})`;
            return sql;
        }

        condition = field.restore(condition);
        debug(`${field.column} => ${condition}`);
        let sql = `\`${field.column}\` = `;
        if (field.type.needQuotes) {
            sql += `"${escape(condition)}"`;
        } else {
            sql += condition;
        }

        return sql;
    }

    /**
     * Make where segment with array
     */
    makeArrayWhere(model: any, condition: any[], logic?: string): string {
        if (!Array.isArray(condition)) {
            throw new Error("Non-array condition.");
        }

        logic = (logic || "AND").toUpperCase() === "OR" ? "OR" : "AND";
        return `(${condition.map((cond) => this.makeWhere(model, cond, "AND")).join(` ${logic} `)})`;
    }

    /**
     * Make where segment
     */
    makeWhere(model: any, condition: any, logic?: string): string {
        logic = (logic || "AND").toUpperCase() === "OR" ? "OR" : "AND";

        if (Array.isArray(condition)) {
            return this.makeArrayWhere(model, condition, logic);
        }

        const fragments: string[] = [];
        Object.keys(condition).forEach((key) => {
            const fragCond = condition[key];
            switch (key) {
                case "$and":
                case "$or": {
                    if (!Array.isArray(fragCond)) {
                        fragments.push(this.makeWhere(model, fragCond, key.substr(1)));
                    } else {
                        fragments.push(this.makeArrayWhere(model, fragCond, key.substr(1)));
                    }
                    break;
                }
                default:
                    fragments.push(this.makeFieldWhere(model, key, fragCond, logic));
                    break;
            }
        });

        return `(${fragments.join(` ${logic} `)})`;
    }

    /**
     * Make order segment
     */
    makeOrder(model: any, order: any[]): string {
        const orderArr = _.compact(order.map((o) => {
            const key = Object.keys(o)[0];
            if (!key) return null;
            const field = model.fieldNamesMap[key];
            if (!field) {
                throw new Error(`no field named "${key}" in model "${model.name}"`);
            }
            return `\`${field.column}\` ${o[key] > 0 ? "ASC" : "DESC"}`;
        }));
        if (!orderArr.length) return "";
        return orderArr.join(", ");
    }

    /**
     * Make limit segment
     */
    makeLimit(model: any, limit: any[]): string {
        return limit.map((l) => parseInt(l, 10) || 0).join(", ");
    }

    /**
     * Make force index segment
     */
    makeIndex(model: any, index: string): string {
        if (!index) return "";
        return `FORCE INDEX(\`${index}\`)`;
    }

    /**
     * Make sql of SET
     */
    makeSet(model: any, update: ObjStatic): string {
        let pattern = "";
        let params: any[] = [];

        for (const key in update) {
            if (!Object.prototype.hasOwnProperty.call(update, key)) continue;
            if (pattern !== "") pattern += ", ";

            const value = update[key];
            const field = model.fieldNamesMap[key];
            if (!field) continue;

            pattern += `\`${field.column}\` = `;

            if (value === null && field.allowNull) {
                pattern += "null";
            } else if (typeof value === "string" && value.length >= 4 &&
                value[0] === "{" && value[1] === "{" &&
                value[value.length - 1] === "}" && value[value.length - 2] === "}") {
                pattern += SqlParser.sqlNameToColumn(value.substr(2, value.length - 4), model.nameToColumn);
            } else {
                if (!field.needQuotes) {
                    pattern += `${escape(field.restore(value))}`;
                } else {
                    pattern += "?";
                    params.push(field.restore(value));
                }
            }
        }

        return this.format(pattern, params);
    }

    /**
     * Make sql of SELECT
     */
    makeFind(model: any, options?: QueryOptions): string {
        options = options || {};

        let fields = options.fields;
        if (!fields || !fields.length) {
            fields = undefined;
        }

        let sql = "SELECT ";
        sql += options.count
            ? "COUNT(0)"
            : fields
                ? _.compact(fields.map((field) => `\`${model.nameToColumn[field]}\``)).join(", ")
                : "*";
        sql += ` FROM \`${model.name}\``;

        if (options.index) {
            const index = this.makeIndex(model, options.index);
            if (index) {
                sql += ` ${index}`;
            }
        }

        if (options.where && Object.keys(options.where).length) {
            const where = this.makeWhere(model, options.where);
            if (where) {
                sql += ` WHERE ${where}`;
            }
        }

        if (options.order && options.order.length) {
            const order = this.makeOrder(model, options.order);
            if (order) {
                sql += ` ORDER BY ${order}`;
            }
        }

        if (options.limit && options.limit.length) {
            const limit = this.makeLimit(model, options.limit);
            if (limit) {
                sql += ` LIMIT ${limit}`;
            }
        }

        return sql;
    }

    /**
     * Make sql of UPDATE
     */
    makeUpdate(model: any, options?: QueryOptions): string {
        options = options || {};
        const set = this.makeSet(model, options.update || {});
        if (!set) throw new Error("no set data.");
        let sql = `UPDATE \`${model.name}\``;

        if (options.index) {
            const index = this.makeIndex(model, options.index);
            if (index) {
                sql += ` ${index}`;
            }
        }

        sql += ` SET ${set}`;

        if (options.where && Object.keys(options.where).length) {
            const where = this.makeWhere(model, options.where);
            if (where) {
                sql += ` WHERE ${where}`;
            }
        }

        if (options.order && options.order.length) {
            const order = this.makeOrder(model, options.order);
            if (order) {
                sql += ` ORDER BY ${order}`;
            }
        }

        if (options.limit && options.limit.length) {
            const limit = this.makeLimit(model, options.limit);
            if (limit) {
                sql += ` LIMIT ${limit}`;
            }
        }

        return sql;
    }

    /**
     * Make sql of DELETE
     */
    makeDelete(model: any, options?: QueryOptions): string {
        options = options || {};
        let sql = `DELETE FROM \`${model.name}\``;

        if (options.where && Object.keys(options.where).length) {
            const where = this.makeWhere(model, options.where);
            if (where) {
                sql += ` WHERE ${where}`;
            }
        }

        if (options.order && options.order.length) {
            const order = this.makeOrder(model, options.order);
            if (order) {
                sql += ` ORDER BY ${order}`;
            }
        }

        if (options.limit && options.limit.length) {
            const limit = options.limit;
            if (limit.length === 1) {
                sql += ` LIMIT ${limit[0]}`;
            } else if (limit[0] === 0) {
                sql += ` LIMIT ${limit[1]}`;
            } else {
                throw new Error("Invalid limit in delete. Refer to " +
                    "http://dev.mysql.com/doc/refman/5.7/en/delete.html#idm139816273062400, " +
                    "https://www.techonthenet.com/mysql/delete_limit.php and " +
                    "http://stackoverflow.com/questions/7142097/mysql-delete-statement-with-limit#answer-7142118");
            }
        }

        return sql;
    }

    /**
     * Make SQL
     */
    makeSql(type: string, model: any, options?: QueryOptions): string {
        if (type === "count") {
            options = options || {};
            options.count = true;
        }

        switch (type) {
            case "find": return this.makeFind(model, options);
            case "count": return this.makeFind(model, options);
            case "update": return this.makeUpdate(model, options);
            case "delete": return this.makeDelete(model, options);
            default: return this.makeFind(model, options);
        }
    }

    /**
     * Find records with no cache
     */
    findWithNoCache(model: any, callback: ResultCallback, options?: QueryOptions): void {
        options = options || {};
        let sql: string;
        try {
            sql = this.makeSql("find", model, options);
        } catch (e) {
            return process.nextTick(function () {
                callback(e as Error);
            });
        }

        this.execute(options.conn, sql, function (err: any, rows: any) {
            if (err) {
                return callback(err, undefined, sql);
            }

            if (options!.single) {
                return callback(undefined, (rows || []).length ? rows[0] : null, sql);
            }

            return callback(undefined, (rows || []), sql);
        });
    }

    /**
     * Find records with cache
     */
    findWithCache(cache: any, model: any, callback: ResultCallback, options?: QueryOptions): void {
        options = options || {};
        const self = this;
        const primaryKeys = model.primaryKeys.map((field: any) => field.name);
        const totalFields = model.schema.map((field: any) => field.name);
        const origFields = _.uniq((options.fields || totalFields).concat(primaryKeys));

        options.fields = primaryKeys;
        let pkSQL: string;
        try {
            pkSQL = this.makeSql("find", model, options);
        } catch (e) {
            return process.nextTick(function () {
                return callback(e as Error, undefined, "");
            });
        }

        this.execute(options.conn, pkSQL, function (err: any, rows: any) {
            if (err) {
                options!.fields = origFields as string[];
                let sql: string;
                try {
                    sql = self.makeSql("find", model, options);
                } catch (e) {
                    return callback(e as Error, undefined, "");
                }
                return callback(err, undefined, sql);
            }

            cache.getData(self.database, model.name, rows, function (err: any, data: any) {
                if (err) data = [];

                let uncachedCount = 0;
                const result: any[] = [];
                const errors: Error[] = [];

                function fetchFromMySQL(taskObject: any): void {
                    const idx = taskObject.task;

                    let sql: string;
                    try {
                        sql = self.makeSql("find", model, {
                            where: model.convertColumnToName(rows[idx]),
                            limit: [0, 1],
                            fields: totalFields,
                        });
                    } catch (e) {
                        errors.push(e as Error);
                        return taskObject.done();
                    }

                    self.execute(options!.conn, sql, function (err: any, row: any) {
                        if (err) {
                            errors.push(err);
                            return taskObject.done();
                        }

                        if (!row || !row.length) {
                            return taskObject.done();
                        }

                        row = row[0];

                        cache.setData(self.database, model.name, rows[idx], row, function () {
                            result[idx] = row;
                            taskObject.done();
                        });
                    });
                }

                const scarlet = new Scarlet(10);

                for (let i = 0; i < rows.length; i++) {
                    const row = _.find(data, (v: any) => {
                        for (const key in rows[i]) {
                            if (rows[i][key] !== v[key]) return false;
                        }
                        return true;
                    });

                    if (undefined !== row) {
                        row.$fromCache = true;
                        result.push(row);
                    } else {
                        uncachedCount++;
                        result.push(undefined);
                        scarlet.push(i, fetchFromMySQL);
                    }
                }

                if (!uncachedCount) {
                    done();
                } else {
                    scarlet.afterFinish(uncachedCount, done, false);
                }

                function done(): void {
                    const err = errors.length ? errors[0] : undefined;

                    const delKeys: string[] = [];
                    for (let i = 0; i < model.schema.length; i++) {
                        if (origFields.indexOf(model.schema[i].name) === -1) {
                            delKeys.push(model.schema[i].column);
                        }
                    }

                    const liteResult = _.compact(result).map((row) => {
                        delKeys.forEach((key) => delete row[key]);
                        return row;
                    });

                    options!.fields = origFields as string[];
                    let extraSql: string;
                    try {
                        extraSql = self.makeSql("find", model, options);
                    } catch (e) {
                        return process.nextTick(function () {
                            return callback(e as Error);
                        });
                    }

                    if (options!.single) {
                        return callback(err, liteResult.length ? liteResult[0] : null, extraSql);
                    }

                    return callback(err, liteResult, extraSql);
                }
            });
        });
    }

    /**
     * Make query to options
     */
    queryToOptions(query: any, options?: ObjStatic): QueryOptions {
        const _options = extend({
            fields: query._fields,
            where: query._where,
            order: query._order,
            limit: query._limit,
            update: query._updateData,
            index: query._index,
        }, options || {}) as QueryOptions;

        _options.conn = query._conn;

        if (_options.single) {
            if (!_options.limit || !_options.limit.length) {
                _options.limit = [0, 1];
            } else if (_options.limit.length === 1) {
                _options.limit[0] = 1;
            } else {
                _options.limit[1] = 1;
            }
        }

        return _options;
    }

    /**
     * Count a condition
     */
    count(query: any, callback: ResultCallback): void {
        const _options = this.queryToOptions(query, {});
        const sql = this.makeSql("count", query.model, _options);
        this.execute(query._conn, sql, function (err: any, rows: any) {
            if (err) return callback(err, undefined, sql);
            return callback(undefined, (rows || [{ "COUNT(0)": 0 }])[0]["COUNT(0)"], sql);
        });
    }

    /**
     * Find with a condition
     */
    find(query: any, callback: ResultCallback, options?: ObjStatic): void {
        const _options = this.queryToOptions(query, options);
        if (!query.cache || _options.noCache) {
            return this.findWithNoCache(query.model, callback, _options);
        } else {
            return this.findWithCache(query.cache, query.model, callback, _options);
        }
    }

    /**
     * Update by query
     */
    updateByQuery(query: any, callback: ResultCallback): void {
        const self = this;
        const options = this.queryToOptions(query);
        const model = query.model;
        let sql: string;
        try {
            sql = this.makeSql("update", query.model, options);
        } catch (e) {
            return process.nextTick(function () {
                return callback(e as Error);
            });
        }

        let primaryKeys: string[];
        async.waterfall([
            function (cb: any) {
                if (!model.cache) {
                    return cb();
                }

                const tempFields = options.fields;
                primaryKeys = model.primaryKeys.map((key: any) => key.name);
                options.fields = primaryKeys;

                let relatedSql: string;
                try {
                    relatedSql = self.makeSql("find", query.model, options);
                } catch (e) {
                    return process.nextTick(function () {
                        cb(e);
                    });
                }
                debug("find related rows when updating", relatedSql);
                self.execute(query._conn, relatedSql, function (err: any, result: any) {
                    if (err) return cb(err);
                    model.cache.deleteKeys(self.getDBName(), model.name, result, function (err: any) {
                        options.fields = tempFields;
                        cb(err);
                    });
                });
            },

            function (cb: any) {
                debug("update data by query", sql);
                self.execute(query._conn, sql, cb);
            },
        ], function (err: any, result: any) {
            if (err === null) err = undefined;
            callback(err, result, sql);
        });
    }

    /**
     * Delete by query
     */
    deleteByQuery(query: any, callback: ResultCallback): void {
        const self = this;
        const options = this.queryToOptions(query);
        const model = query.model;
        let sql: string;
        try {
            sql = this.makeSql("delete", query.model, options);
        } catch (e) {
            return process.nextTick(function () {
                return callback(e as Error);
            });
        }

        let primaryKeys: string[];
        async.waterfall([
            function (cb: any) {
                if (!model.cache) {
                    return cb();
                }

                const tempFields = options.fields;
                primaryKeys = model.primaryKeys.map((key: any) => key.name);
                options.fields = primaryKeys;

                let relatedSql: string;
                try {
                    relatedSql = self.makeSql("find", query.model, options);
                } catch (e) {
                    return process.nextTick(function () {
                        return cb(e);
                    });
                }
                debug("find related rows when deleting", relatedSql);
                self.execute(query._conn, relatedSql, function (err: any, result: any) {
                    if (err) return cb(err);
                    model.cache.deleteKeys(self.getDBName(), model.name, result, function (err: any) {
                        options.fields = tempFields;
                        cb(err);
                    });
                });
            },

            function (cb: any) {
                debug("delete data by query", sql);
                self.execute(query._conn, sql, cb);
            },
        ], function (err: any, result: any) {
            if (err === null) err = undefined;
            callback(err, result, sql);
        });
    }

    /**
     * Insert record
     */
    insert(model: any, conn: any, data: any[], callback: ResultCallback): void {
        const primaryValues: ObjStatic = {};
        const _set = data.reduce((_set: string[], data) => {
            if (data.value === null) {
                _set.push(`\`${data.field.column}\` = NULL`);
            } else if (data.field.needQuotes) {
                _set.push(`\`${data.field.column}\` = ${SqlString.escape(data.field.restore(data.value))}`);
            } else {
                _set.push(`\`${data.field.column}\` = ${data.field.restore(data.value)}`);
            }

            if (data.field.primaryKey || !model.primaryKeys.length) {
                primaryValues[data.field.name] = data.value;
            }

            return _set;
        }, []);

        const sql = `INSERT INTO \`${model.name}\` SET ${_set.join(", ")}`;
        this.execute(conn, sql, function (err: any, row: any) {
            if (err) return callback(err, undefined, sql);
            if (!row) {
                return callback(new Error("no row inserted."), undefined, sql);
            }

            let where: ObjStatic = {};
            const primaryKeys = model.primaryKeys;
            const autoIncrement = model.ai;

            if (row.insertId) {
                if (primaryKeys.length === 1) {
                    if (!autoIncrement || autoIncrement.primaryKey) {
                        where[primaryKeys[0].name] = row.insertId;
                    } else {
                        where = primaryValues;
                    }
                } else if (primaryKeys.length) {
                    where = primaryValues;
                    if (autoIncrement && autoIncrement.primaryKey) {
                        where[autoIncrement.name] = row.insertId;
                    }
                } else {
                    console.error("[TOSHIHIKO WARNING] no primary key while inserting may cause some problems!");
                    where = primaryValues;
                    if (autoIncrement) {
                        where[autoIncrement.name] = row.insertId;
                    }
                }
            } else {
                where = primaryValues;
            }

            let _model = model;
            if (conn) {
                _model = _model.conn(conn);
            }

            _model.where(where).findOne(function (err: any, row: any) {
                if (err) {
                    return callback(err, undefined, sql);
                }

                if (!row) {
                    return callback(new Error("insert successfully but failed to read the record."), undefined, sql);
                }

                return callback(undefined, row, sql);
            });
        });
    }

    /**
     * Update record
     */
    update(model: any, conn: any, pk: ObjStatic, data: any[], callback: ResultCallback): void {
        if (!pk || !data) {
            return process.nextTick(function () {
                callback(new Error("Invalid parameters."));
            });
        }

        const _set = data.reduce((_set: string[], data) => {
            if (data.value === null) {
                _set.push(`\`${data.field.column}\` = NULL`);
            } else if (data.field.needQuotes) {
                _set.push(`\`${data.field.column}\` = ${SqlString.escape(data.field.restore(data.value))}`);
            } else {
                _set.push(`\`${data.field.column}\` = ${data.field.restore(data.value)}`);
            }
            return _set;
        }, []);

        const _updateWhere = this.makeWhere(model, pk, "and");
        if (_updateWhere === "()") {
            return process.nextTick(function () {
                callback(new Error("Broken yukari object."));
            });
        }

        if (!_set.length) {
            return process.nextTick(function () {
                callback(new Error("Broken update data information."));
            });
        }

        const self = this;
        const pkNames = model.primaryKeys.map((key: any) => key.name);
        const sql = `UPDATE \`${model.name}\` SET ${_set.join(", ")} WHERE ${_updateWhere}`;

        async.waterfall([
            function (cb: any) {
                if (!model.cache) return cb();

                let relatedSql: string;
                try {
                    relatedSql = self.makeSql("find", model, {
                        where: pk,
                        limit: [0, 1],
                        fields: pkNames,
                    });
                } catch (e) {
                    return process.nextTick(function () {
                        cb(e);
                    });
                }
                debug("find related row when updating Yukari", relatedSql);
                self.execute(conn, relatedSql, function (err: any, result: any) {
                    if (err) return cb(err);
                    model.cache.deleteKeys(self.getDBName(), model.name, result, function (err: any) {
                        return cb(err);
                    });
                });
            },

            function (cb: any) {
                self.execute(conn, sql, function (err: any, results: any) {
                    if (err) return cb(err);
                    if (!results.affectedRows) {
                        return cb(new Error("Out-dated yukari data."));
                    }
                    return cb();
                });
            },
        ], function (err: any) {
            return callback(err, sql);
        });
    }

    /**
     * Execute SQL
     */
    execute(conn: any, sql?: string, params?: any, callback?: ResultCallback): void {
        if (typeof conn === "string") {
            callback = params;
            params = sql;
            sql = conn;
            conn = null;
        }

        if (typeof params === "function") {
            callback = params;
            params = undefined;
        }

        if (params && ((params as any[]).length || !Array.isArray(params))) {
            sql = this.format(sql!, params);
        }

        debug(`executing sql 【${sql}】`);
        if (this.options.showSql) {
            (this.options.showSql as Function)(sql);
        }

        if (conn) {
            conn.query(sql, function (err: any, rows: any) {
                callback!(err, rows);
            });
        } else {
            this.mysql.getConnection(function (err: any, conn: any) {
                if (err) return callback!(err);
                conn.query(sql, function (err: any, rows: any) {
                    conn.release();
                    callback!(err, rows);
                });
            });
        }
    }

    /**
     * Begin transaction
     */
    beginTransaction(callback: ResultCallback): void {
        this.mysql.getConnection(function (err: any, conn: any) {
            if (err) return callback(err);
            conn.beginTransaction(function (err: any) {
                if (err) {
                    conn.release();
                    return callback(err);
                }
                return callback(undefined, conn);
            });
        });
    }

    /**
     * Commit transaction
     */
    commit(conn: any, callback: ResultCallback): void {
        conn.commit(function (err: any) {
            if (err) {
                return callback(err);
            }
            conn.release();
            return callback(undefined);
        });
    }

    /**
     * Rollback transaction
     */
    rollback(conn: any, callback: ResultCallback): void {
        conn.rollback(function (err: any) {
            if (err) {
                return callback(err);
            }
            conn.release();
            return callback(undefined);
        });
    }
}

export default MySQLAdapter;
