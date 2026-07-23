/**
 * Toshihiko - Yukari (Record) class
 */

import _ from "lodash";
import async from "async";

import { promisify } from "./util/common";
import FieldType from "./field_type";
import { ObjStatic, OnlyErrorCallback, ResultCallback, AdapterData, PromisifiedCallback } from "./types";

export type YukariSource = "new" | "query" | "delete";

export class Yukari {
    [key: string]: any;

    public $model: any;
    public $toshihiko: any;
    public $schema: any[];
    public $origData: ObjStatic;
    public $source: YukariSource;
    public $dbName: string;
    public $tableName: string;
    public $cache: any;
    public $fromCache: boolean;
    public $adapter: any;

    // Compatibility aliases
    public _initRow: (row: ObjStatic, rowInOrigName?: boolean) => void;
    public _buildRow: (row: ObjStatic, rowInOrigName?: boolean) => void;
    public _fieldAt: (name: string) => number;

    constructor(model: any, source: YukariSource) {
        this.$model = model;
        this.$toshihiko = model.parent;
        this.$schema = model.schema;
        this.$origData = {};
        this.$source = source;
        this.$dbName = model.parent.database;
        this.$tableName = model.name;
        this.$cache = model.cache;
        this.$fromCache = false;
        this.$adapter = model.parent.adapter;

        // Compatibility aliases
        this._initRow = this.fillRowFromSource.bind(this);
        this._buildRow = this.buildNewRow.bind(this);
        this._fieldAt = this.fieldIndex.bind(this);
    }

    /**
     * Fill row from source
     */
    fillRowFromSource(row: ObjStatic, rowInOrigName?: boolean): void {
        this.$origData = {};
        for (let i = 0; i < this.$schema.length; i++) {
            const field = this.$schema[i];
            const colName = rowInOrigName ? field.column : field.name;

            if (undefined === row[colName]) continue;

            this.$origData[field.name] = {
                fieldIdx: i,
                data: row[colName] === null ? null : field.type.parse(row[colName]),
            };
        }

        for (const key in this.$origData) {
            if (!Object.prototype.hasOwnProperty.call(this.$origData, key)) continue;
            Object.defineProperty(this, key, {
                enumerable: true,
                configurable: false,
                writable: true,
                value: _.cloneDeep(this.$origData[key].data),
            });
        }

        if (row.$fromCache) {
            this.$fromCache = true;
        }
    }

    /**
     * Build a new row
     */
    buildNewRow(row: ObjStatic, rowInOrigName?: boolean): void {
        this.$origData = {};

        for (let i = 0; i < this.$schema.length; i++) {
            const field = this.$schema[i];
            let value = row[rowInOrigName ? field.column : field.name];

            if (undefined === value && undefined !== field.defaultValue) {
                value = field.defaultValue;
            }

            if (undefined === value) continue;

            Object.defineProperty(this, field.name, {
                enumerable: true,
                configurable: false,
                writable: true,
                value: _.cloneDeep(value),
            });
        }

        if (row.$fromCache) {
            this.$fromCache = true;
        }
    }

    /**
     * Get field's index
     */
    fieldIndex(name: string): number {
        if (this.$source !== "new" && this.$origData[name]) {
            return this.$origData[name].fieldIdx;
        } else if (this.$source === "new") {
            for (let i = 0; i < this.$schema.length; i++) {
                if (this.$schema[i].name === name) {
                    return i;
                }
            }
        }
        return -1;
    }

    /**
     * Validate one column
     */
    validateOne(name: string, value: any, callback: OnlyErrorCallback): void {
        const self = this;
        const fieldIdx = this.fieldIndex(name);
        if (-1 === fieldIdx) {
            return callback(new Error(`No such field ${name}`));
        }

        const field = this.$schema[fieldIdx];

        if (null === value) {
            return callback(field.allowNull ? undefined : new Error(`Field ${name} can't be null.`));
        }

        if (!field.validators.length) {
            return callback();
        }

        let err: Error | undefined;
        let i = 0;
        async.whilst(
            function (cb: any) { cb(null, !err && i < field.validators.length); },
            function (cb: any) {
                const validator = field.validators[i++];
                if (validator.length <= 1) {
                    const result = validator.bind(self.$model)(value);
                    if (typeof result === "string" && result.length) {
                        err = new Error(result);
                        return cb(err);
                    }
                } else {
                    return validator.bind(self.$model)(value, function (_err: any) {
                        if (_err) {
                            err = _err;
                        }
                        return cb(err);
                    });
                }
                cb();
            },
            function () {
                return callback(err);
            }
        );
    }

    /**
     * Validate all columns
     */
    validateAll(callback: OnlyErrorCallback): void {
        const self = this;
        async.eachLimit(Object.keys(this), 10, function (key, cb) {
            if (!Object.prototype.hasOwnProperty.call(self, key)) return cb();
            if (key && (key[0] === "$" || typeof self[key] === "function" || self.fieldIndex(key) === -1)) {
                return cb();
            }

            self.validateOne(key, self[key], function (err) {
                return cb(err);
            });
        }, function (err) {
            return callback(err as Error | undefined);
        });
    }

    /**
     * Delete this object
     */
    delete(conn?: any, callback?: ResultCallback): Promise<boolean> {
        if (typeof conn === "function") {
            callback = conn;
            conn = null;
        }
        if (callback === undefined) callback = function () {};

        const promisifiedCallback = promisify(callback) as PromisifiedCallback;
        if (this.$source === "new") {
            promisifiedCallback(new Error("You can't call this function via a new Yukari object."));
            return promisifiedCallback.promise;
        }

        let pk: ObjStatic;
        if (this.$model.primaryKeys.length) {
            pk = this.$model.primaryKeys.reduce((pks: ObjStatic, field: any) => {
                if (this.$origData[field.name]) {
                    pks[field.name] = this.$origData[field.name].data;
                }
                return pks;
            }, {});
        } else {
            pk = Object.keys(this.$origData).reduce((pks: ObjStatic, key) => {
                pks[key] = this.$origData[key].data;
                return pks;
            }, {});
        }

        const self = this;
        this.$model.where(pk).conn(conn).limit("0, 1").delete(function (err: any, result: any, sql: string) {
            if (err) return promisifiedCallback(err);
            if (!result) return promisifiedCallback(new Error("unknown error."));
            self.$source = "delete";
            return promisifiedCallback(undefined, true, sql);
        });

        return promisifiedCallback.promise;
    }

    /**
     * Insert this object
     */
    insert(conn?: any, callback?: ResultCallback): Promise<Yukari | null> {
        if (typeof conn === "function") {
            callback = conn;
            conn = null;
        }
        if (callback === undefined) callback = function () {};

        const promisifiedCallback = promisify(callback) as PromisifiedCallback;
        if (this.$source !== "new") {
            promisifiedCallback(new Error("You must call this function via a new Yukari object."));
            return promisifiedCallback.promise;
        }

        const self = this;
        async.waterfall([
            self.validateAll.bind(self),
            self.$adapter.insert.bind(self.$adapter, self.$model, conn, Yukari.extractAdapterData(self.$model, self)),
        ], function (err: any, row: any, extra: any) {
            if (err) return promisifiedCallback(err, null, extra);

            for (const key in row) {
                if (!Object.prototype.hasOwnProperty.call(row, key)) continue;
                if (key && key[0] === "$" && key !== "$origData") {
                    continue;
                }

                if (typeof row[key] === "function") continue;

                self[key] = (key === "$origData") ? row[key] : _.cloneDeep(row[key]);
            }

            return promisifiedCallback(undefined, self, extra);
        } as any);

        return promisifiedCallback.promise;
    }

    /**
     * Update this object
     */
    update(conn?: any, callback?: ResultCallback): Promise<Yukari | null> {
        if (typeof conn === "function") {
            callback = conn;
            conn = null;
        }
        if (callback === undefined) callback = function () {};

        const promisifiedCallback = promisify(callback) as PromisifiedCallback;
        if (this.$source === "new") {
            promisifiedCallback(new Error("You must call this function via an old Yukari object."));
            return promisifiedCallback.promise;
        }

        const model = this.$model;
        let data: AdapterData[] = [];
        for (const key in this) {
            if (!Object.prototype.hasOwnProperty.call(this, key)) continue;
            if (key.length && key[0] === "$") continue;
            if (typeof this[key] === "function") continue;
            const field = model.fieldNamesMap[key];
            if (undefined === field) continue;

            const equalFunc = (undefined === field.type.equal)
                ? FieldType.$equal.bind(FieldType)
                : field.type.equal.bind(field.type);

            if ((null === this[key] || null === this.$origData[key].data) &&
                this[key] !== this.$origData[key].data && field.allowNull) {
                data.push({ field: field, value: this[key] });
                continue;
            }

            if (!equalFunc(this[key], this.$origData[key].data)) {
                data.push({ field: field, value: this[key] });
                continue;
            }
        }

        // FIX: if no data changed, change all data
        if (!_.size(data)) data = Yukari.extractAdapterData(model, this);

        let pk: ObjStatic;
        if (this.$model.primaryKeys.length) {
            pk = this.$model.primaryKeys.reduce((pks: ObjStatic, field: any) => {
                if (this.$origData[field.name]) {
                    pks[field.name] = this.$origData[field.name].data;
                }
                return pks;
            }, {});
        } else {
            pk = Object.keys(this.$origData).reduce((pks: ObjStatic, key) => {
                pks[key] = this.$origData[key].data;
                return pks;
            }, {});
        }

        const self = this;
        async.waterfall([
            self.validateAll.bind(self),
            function (cb: any) {
                self.$adapter.update(self.$model, conn, pk, data, cb);
            },
        ], function (err: any, extra: any) {
            if (err) return promisifiedCallback(err);

            for (const key in data) {
                if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
                const d = data[key as any];
                self.$origData[d.field.name].data = d.value;
            }
            self.$source = "query";

            promisifiedCallback(err, self, extra);
        });

        return promisifiedCallback.promise;
    }

    /**
     * Save this object
     */
    save(conn?: any, callback?: ResultCallback): Promise<Yukari | null> {
        if (typeof conn === "function") {
            callback = conn;
            conn = null;
        }
        if (undefined === callback) callback = function () {};
        if (this.$source === "new") {
            return this.insert(conn, callback);
        } else {
            return this.update(conn, callback);
        }
    }

    /**
     * Convert to JSON
     */
    toJSON(old?: boolean): ObjStatic {
        const result: ObjStatic = {};
        const obj = old ? this.$origData : this;
        if (!old) {
            for (const key in obj) {
                if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
                if (key.length && key[0] !== "$" && typeof obj[key] !== "function") {
                    result[key] = obj[key];

                    const idx = this.fieldIndex(key);
                    if (idx !== -1 && typeof this.$schema[idx].type.toJSON === "function") {
                        result[key] = this.$schema[idx].type.toJSON(result[key]);
                    }
                }
            }
            return result;
        } else {
            for (const key in obj) {
                if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
                result[key] = obj[key].data;

                if (typeof this.$schema[obj[key].fieldIdx].type.toJSON === "function") {
                    result[key] = this.$schema[obj[key].fieldIdx].type.toJSON(result[key]);
                }
            }
            return result;
        }
    }

    /**
     * Extract yukari data for adapter
     */
    static extractAdapterData(model: any, dataInYukari: any): AdapterData[] {
        return Object.keys(dataInYukari).reduce((data: AdapterData[], key) => {
            if (!Object.prototype.hasOwnProperty.call(dataInYukari, key)) return data;
            if (key.length && key[0] === "$") return data;
            const field = model.fieldNamesMap[key];
            if (undefined === field) return data;

            data.push({
                field: field,
                value: dataInYukari[key],
            });
            return data;
        }, []);
    }
}

export default Yukari;
