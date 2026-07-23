/**
 * Toshihiko - Model class
 */

import createDebug from "debug";
import { EventEmitter2 } from "eventemitter2";

import { promisify } from "./util/common";
import { ToshihikoField } from "./field";
import { ToshihikoQuery } from "./query";
import { Yukari } from "./yukari";
import { ObjStatic, SchemaDefinition, ModelOptions, ResultCallback, FindOptions, PromisifiedCallback } from "./types";

const debug = createDebug("toshihiko:model");

export class ToshihikoModel extends EventEmitter2 {
    public ai: ToshihikoField | null = null;
    public readonly primaryKeys: ToshihikoField[] = [];
    public readonly name: string;
    public readonly parent: any;
    public readonly originalSchema: SchemaDefinition[];
    public readonly options: ModelOptions;
    public readonly schema: ToshihikoField[];
    public readonly cache: any;

    public readonly nameToColumn: ObjStatic = {};
    public readonly columnToName: ObjStatic = {};
    public readonly fieldColumnsMap: ObjStatic = {};
    public readonly fieldNamesMap: ObjStatic = {};

    // Compatibility with 0.x
    public readonly _fieldsKeyMap: ObjStatic;

    constructor(collectionName: string, toshihiko: any, schema: SchemaDefinition[], options?: ModelOptions) {
        super();

        this.name = collectionName;
        this.parent = toshihiko;
        this.originalSchema = schema;
        this.options = options || {};

        this.schema = schema.map((opts) => {
            const field = new ToshihikoField(opts);
            if (field.primaryKey) {
                this.primaryKeys.push(field);
            }

            if (field.autoIncrement) this.ai = field;

            return field;
        });

        if (!this.primaryKeys.length) {
            this.emit("log", `!!! WARNING: YOU'D BETTER ADD PRIMARY KEY(S) IN MODEL ${this.name} !!!`);
        }

        // Specify cache
        const Toshihiko = require("./toshihiko").default;
        if (this.options.cache) {
            this.cache = Toshihiko.createCache(this.options.cache);
        } else if (this.parent.cache && this.options.cache === undefined) {
            this.cache = this.parent.cache;
        } else {
            this.cache = null;
        }

        // Key maps
        this.schema.forEach((field) => {
            this.nameToColumn[field.name] = field.column;
            this.columnToName[field.column] = field.name;
            this.fieldColumnsMap[field.column] = field;
            this.fieldNamesMap[field.name] = field;
        });

        // Compatibility with 0.x
        this._fieldsKeyMap = {
            n2c: this.nameToColumn,
            c2n: this.columnToName,
            name: this.fieldNamesMap,
            column: this.fieldColumnsMap,
        };

        debug(`"${this.name}" created.`, this);
    }

    /**
     * Compatibility with 0.x
     */
    get _fields(): ToshihikoField[] {
        return this.schema;
    }

    /**
     * Compatibility with 0.x
     */
    get toshihiko(): any {
        return this.parent;
    }

    /**
     * Begin transaction
     */
    beginTransaction(callback?: ResultCallback): Promise<any> {
        if (undefined === callback) callback = function () {};
        const promisifiedCallback = promisify(callback) as PromisifiedCallback;

        this.parent.adapter.beginTransaction(promisifiedCallback);
        return promisifiedCallback.promise;
    }

    /**
     * Commit transaction
     */
    commit(conn: any, callback?: ResultCallback): Promise<void> {
        if (undefined === callback) callback = function () {};
        const promisifiedCallback = promisify(callback) as PromisifiedCallback;

        this.parent.adapter.commit(conn, promisifiedCallback);
        return promisifiedCallback.promise;
    }

    /**
     * Rollback transaction
     */
    rollback(conn: any, callback?: ResultCallback): Promise<void> {
        if (undefined === callback) callback = function () {};
        const promisifiedCallback = promisify(callback) as PromisifiedCallback;

        this.parent.adapter.rollback(conn, promisifiedCallback);
        return promisifiedCallback.promise;
    }

    /**
     * Build a new yukari object
     */
    build(fields: ObjStatic): Yukari {
        const yukari = new Yukari(this, "new");
        yukari.buildNewRow(fields);
        return yukari;
    }

    /**
     * Where condition
     */
    where(condition: ObjStatic): ToshihikoQuery {
        return (new ToshihikoQuery(this)).where(condition);
    }

    /**
     * Field - same as fields
     */
    field(fields: string | string[]): ToshihikoQuery {
        return (new ToshihikoQuery(this)).fields(fields);
    }

    /**
     * Fields - same as field
     */
    fields(fields: string | string[]): ToshihikoQuery {
        return (new ToshihikoQuery(this)).fields(fields);
    }

    /**
     * Limit
     */
    limit(limit: number | string | Array<number | string>, second?: number | string): ToshihikoQuery {
        if (arguments.length <= 1) return (new ToshihikoQuery(this)).limit(limit as any);
        const query = new ToshihikoQuery(this);
        return query.limit.apply(query, arguments as any);
    }

    /**
     * Index
     */
    index(idx: string): ToshihikoQuery {
        return (new ToshihikoQuery(this)).index(idx);
    }

    /**
     * Order - same as orderBy
     */
    order(order: string | ObjStatic | Array<string | ObjStatic>): ToshihikoQuery {
        return (new ToshihikoQuery(this)).order(order);
    }

    /**
     * Use conn to do this query
     */
    conn(conn: any): ToshihikoQuery {
        return (new ToshihikoQuery(this)).conn(conn);
    }

    /**
     * OrderBy - same as order
     */
    orderBy(order: string | ObjStatic | Array<string | ObjStatic>): ToshihikoQuery {
        return (new ToshihikoQuery(this)).orderBy(order);
    }

    /**
     * Do count
     */
    count(callback?: ResultCallback): Promise<number> {
        return (new ToshihikoQuery(this)).count(callback);
    }

    /**
     * Do find
     */
    find(callback?: ResultCallback | boolean | FindOptions, toJSON?: boolean | FindOptions, options?: FindOptions): Promise<any> {
        return (new ToshihikoQuery(this)).find(callback as any, toJSON as any, options);
    }

    /**
     * Do find by primary key(s)
     */
    findById(id: any, callback?: ResultCallback, toJSON?: boolean): Promise<any> {
        return (new ToshihikoQuery(this)).findById(id, callback, toJSON);
    }

    /**
     * Do find one record
     */
    findOne(callback?: ResultCallback, toJSON?: boolean): Promise<any> {
        return (new ToshihikoQuery(this)).findOne(callback, toJSON);
    }

    /**
     * Do update
     */
    update(data: ObjStatic, callback?: ResultCallback): Promise<any> {
        return (new ToshihikoQuery(this)).update(data, callback);
    }

    /**
     * Do delete
     */
    delete(callback?: ResultCallback): Promise<any> {
        return (new ToshihikoQuery(this)).delete(callback);
    }

    /**
     * Do adapter's execute
     */
    execute(...args: any[]): Promise<any> {
        const query = new ToshihikoQuery(this);
        return query.execute.apply(query, args);
    }

    /**
     * Convert column to name
     */
    convertColumnToName(object: string | string[] | ObjStatic): string | string[] | ObjStatic | undefined {
        if (typeof object === "string") {
            return this.columnToName[object];
        }

        if (Array.isArray(object)) {
            return object.map((o) => this.columnToName[o]);
        }

        if (typeof object === "object") {
            const result: ObjStatic = {};
            for (const key in object) {
                if (!Object.prototype.hasOwnProperty.call(object, key)) continue;
                const temp = this.convertColumnToName(key) as string;
                if (undefined === temp) continue;
                result[temp] = (object as ObjStatic)[key];
            }
            return result;
        }

        return undefined;
    }

    /**
     * Compatibility with 0.x - get primary key(s) name(s)
     */
    getPrimaryKeysName(): string | string[] {
        if (!this.primaryKeys.length) return [];
        if (this.primaryKeys.length === 1) return this.primaryKeys[0].name;
        return this.primaryKeys.map((pri) => pri.name);
    }

    /**
     * Compatibility with 0.x - get primary key(s) column(s)
     */
    getPrimaryKeysColumn(): string | string[] {
        if (!this.primaryKeys.length) return [];
        if (this.primaryKeys.length === 1) return this.primaryKeys[0].column;
        return this.primaryKeys.map((pri) => pri.column);
    }
}

export default ToshihikoModel;
