/**
 * Toshihiko - Query class
 */

import _ from "lodash";

import { promisify } from "./util/common";
import { Yukari } from "./yukari";
import { ObjStatic, ResultCallback, FindOptions, PromisifiedCallback } from "./types";

export class ToshihikoQuery {
    public readonly toshihiko: any;
    public readonly adapter: any;
    public readonly model: any;
    public readonly cache: any;

    public _fields: string[];
    public _limit: number[];
    public _order: ObjStatic[];
    public _updateData: ObjStatic;
    public _where: ObjStatic;
    public _index: string;
    public _conn: any;

    // Aliases
    public field: (fields: string | string[]) => ToshihikoQuery;
    public orderBy: (order: string | ObjStatic | Array<string | ObjStatic>) => ToshihikoQuery;

    constructor(model: any) {
        this.toshihiko = model.parent;
        this.adapter = model.parent.adapter;
        this.model = model;
        this.cache = model.cache;

        this._fields = this.model.schema.map((field: any) => field.name);
        this._limit = [];
        this._order = [];
        this._updateData = {};
        this._where = {};
        this._index = "";
        this._conn = null;

        // Aliases
        this.field = this.fields;
        this.orderBy = this.order;
    }

    /**
     * Set index key
     */
    index(idx: string): ToshihikoQuery {
        this._index = idx;
        return this;
    }

    /**
     * Set where condition
     */
    where(condition: ObjStatic): ToshihikoQuery {
        if (typeof condition !== "object") {
            throw new Error(`query condition expected to be an object but got ${typeof condition} ${condition}.`);
        }

        this._where = condition;
        return this;
    }

    /**
     * Set fields
     */
    fields(fields: string | string[]): ToshihikoQuery {
        if (typeof fields === "string") {
            fields = _.compact(fields.split(",").map((field) => field.trim()));
        }

        if (!Array.isArray(fields)) {
            throw new Error(`query fields expected to be an array or string but got ${typeof fields} ${fields}.`);
        }

        this._fields = fields;
        return this;
    }

    /**
     * Set limit
     */
    limit(limit: number | string | Array<number | string>, second?: number | string): ToshihikoQuery {
        if (arguments.length >= 2) {
            this._limit = [parseInt(arguments[0] as string, 10) || 0, parseInt(arguments[1] as string, 10) || 0];
            return this;
        } else if (typeof limit === "number") {
            this._limit = [limit];
            return this;
        } else if (typeof limit === "string") {
            if ((limit as string).trim() !== "") {
                limit = (limit as string).split(",");
            } else {
                limit = [];
            }
        }

        if (!Array.isArray(limit)) {
            throw new Error(`query limit expected to be an array, number or string but got ${typeof limit} ${limit}.`);
        }

        if (limit.length > 2) limit = [limit[0], limit[1]];

        this._limit = (limit as Array<number | string>).map((l) => parseInt(l as string, 10) || 0);
        return this;
    }

    /**
     * Set order
     */
    order(order: string | ObjStatic | Array<string | ObjStatic>): ToshihikoQuery {
        let result: ObjStatic[];

        if (typeof order === "string") {
            result = _.compact((order as string).split(",").map((order) => {
                const res: ObjStatic = {};

                const parts = _.compact(order.split(" "));
                if (!parts.length) return null;
                res[parts[0].trim()] = ((parts[1] || "ASC").trim().toUpperCase() === "ASC") ? 1 : -1;
                return res;
            }));
        } else if (Array.isArray(order)) {
            result = (order as Array<string | ObjStatic>).map((order) => {
                const res: ObjStatic = {};

                if (typeof order === "string") {
                    const parts = order.split(" ");
                    res[parts[0].trim()] = ((parts[1] || "ASC").trim().toUpperCase() === "ASC") ? 1 : -1;
                    return res;
                }

                Object.keys(order).forEach((key) => {
                    res[key.trim()] = (typeof order[key] === "number")
                        ? order[key]
                        : ((order[key] as string).toUpperCase() === "ASC" ? 1 : -1);
                });
                return res;
            });
        } else {
            result = Object.keys(order as ObjStatic).map((key) => {
                const res: ObjStatic = {};
                res[key.trim()] = (typeof (order as ObjStatic)[key] === "number")
                    ? (order as ObjStatic)[key]
                    : (((order as ObjStatic)[key] as string).toUpperCase() === "ASC" ? 1 : -1);
                return res;
            });
        }

        this._order = result;
        return this;
    }

    /**
     * Do count
     */
    count(callback?: ResultCallback): Promise<number> {
        const promisifiedCallback = promisify(callback);
        this.adapter.count(this, function (err: any, count: any, extra: any) {
            return promisifiedCallback(err, count, extra);
        });
        return promisifiedCallback.promise;
    }

    /**
     * Do find
     */
    find(callback?: ResultCallback | boolean | FindOptions, toJSON?: boolean | FindOptions, options?: FindOptions): Promise<any> {
        // Parse flexible arguments
        for (let i = 0; i < arguments.length; i++) {
            switch (typeof arguments[i]) {
                case "function": callback = arguments[i] as ResultCallback; break;
                case "boolean": toJSON = arguments[i] as boolean; break;
                case "object": options = arguments[i] as FindOptions; break;
                default: break;
            }
        }

        if (typeof callback !== "function") callback = function () {};
        if (typeof toJSON !== "boolean") toJSON = false;
        if (typeof options !== "object") options = {};
        options = options || {};

        const promisifiedCallback = promisify(callback as Function) as PromisifiedCallback;
        const self = this;

        this.adapter.find(this, function (err: any, row: any, extra: any) {
            if ((options as FindOptions).single && row) {
                if (row instanceof Yukari && toJSON) {
                    row = row.toJSON();
                } else if (!(row instanceof Yukari)) {
                    const yukari = new Yukari(self.model, "query");
                    yukari.fillRowFromSource(row, true);
                    row = toJSON ? yukari.toJSON() : yukari;
                }
            } else if (!(options as FindOptions).single) {
                if (row && row.length) {
                    row = row.map((row: any) => {
                        if (row instanceof Yukari) return toJSON ? row.toJSON() : row;

                        const yukari = new Yukari(self.model, "query");
                        yukari.fillRowFromSource(row, true);
                        return toJSON ? yukari.toJSON() : yukari;
                    });
                }
            }

            return promisifiedCallback(err, row, extra);
        }, {
            single: !!(options as FindOptions).single,
            noCache: !!(options as FindOptions).noCache,
        });

        return promisifiedCallback.promise;
    }

    /**
     * Do find by primary key(s)
     */
    findById(_id: any, callback?: ResultCallback, toJSON?: boolean): Promise<any> {
        const self = this;

        let id = _id;
        if (this.model.primaryKeys.length === 1 && typeof _id !== "object") {
            id = {};
            id[this.model.primaryKeys[0].name] = _id;
        }

        if (typeof id !== "object") {
            return new Promise((resolve, reject) => {
                process.nextTick(function () {
                    const err = new Error("you should pass a valid IDs object");
                    if (callback) callback(err);
                    reject(err);
                });
            });
        }

        if (this.cache) {
            return new Promise((resolve, reject) => {
                this.cache.getData(this.toshihiko.database, this.model.name, id, function (err: any, data: any) {
                    if (err) data = [];

                    if (data.length !== 0) {
                        const yukari = new Yukari(self.model, "query");
                        yukari.fillRowFromSource(data[0], true);
                        const result = toJSON ? yukari.toJSON() : yukari;
                        if (callback) callback(undefined, result);
                        resolve(result);
                        return;
                    }

                    // fallback with no cache
                    self.where(id).findOne(callback, toJSON).then(resolve).catch(reject);
                });
            });
        }

        return this.where(id).findOne(callback, toJSON);
    }

    /**
     * Do find one record
     */
    findOne(callback?: ResultCallback, toJSON?: boolean): Promise<any> {
        return this.find(callback, toJSON, { single: true });
    }

    /**
     * Do update
     */
    update(data: ObjStatic, callback?: ResultCallback): Promise<any> {
        if (undefined === callback) callback = function () {};
        this._updateData = data;

        const promisifiedCallback = promisify(callback);
        this.adapter.updateByQuery(this, promisifiedCallback);
        return promisifiedCallback.promise;
    }

    /**
     * Do delete
     */
    delete(callback?: ResultCallback): Promise<any> {
        if (undefined === callback) callback = function () {};

        const promisifiedCallback = promisify(callback);
        this.adapter.deleteByQuery(this, promisifiedCallback);
        return promisifiedCallback.promise;
    }

    /**
     * Set the connection
     */
    conn(conn: any): ToshihikoQuery {
        this._conn = conn;
        return this;
    }

    /**
     * Do adapter's execute
     */
    execute(...args: any[]): Promise<any> {
        let trueCallback: Function = function () {};
        let cbIdx: number | undefined;

        for (let i = 0; i < args.length; i++) {
            if (typeof args[i] === "function") {
                trueCallback = args[i];
                cbIdx = i;
            }
        }

        const promisifiedCallback = promisify(trueCallback) as PromisifiedCallback;
        if (cbIdx === undefined) {
            args.push(promisifiedCallback);
        } else {
            args[cbIdx] = promisifiedCallback;
        }
        args.unshift(this._conn);

        this.adapter.execute.apply(this.adapter, args);

        return promisifiedCallback.promise;
    }
}

export default ToshihikoQuery;
