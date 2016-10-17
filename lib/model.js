/**
 * XadillaX created at 2016-08-09 11:53:15 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const debug = require("debug")("toshihiko:model");
const EventEmitter = require("eventemitter2").EventEmitter2;

const Field = require("./field");
const Query = require("./query");
const Yukari = require("./yukari");

class ToshihikoModel extends EventEmitter {
    constructor(collectionName, toshihiko, schema, options) {
        super();

        this.ai = null;

        Object.defineProperties(this, {
            primaryKeys: {
                enumerable: true,
                value: []
            },
            name: {
                enumerable: true,
                value: collectionName
            },
            parent: {
                value: toshihiko
            },
            originalSchema: {
                value: schema
            },
            options: {
                value: options || {}
            }
        });

        Object.defineProperty(this, "schema", {
            enumerable: true,
            value: schema.map(options => {
                const field = new Field(options);
                if(field.primaryKey) {
                    this.primaryKeys.push(field);
                }

                if(field.autoIncrement) this.ai = field;

                return field;
            })
        });

        if(!this.primaryKeys.length) {
            this.emit("log", `!!! WARNING: YOU'D BETTER ADD PRIMARY KEY(S) IN MODEL ${this.name} !!!`);
        }

        // specify cache
        const Toshihiko = require("./toshihiko");
        if(this.options.cache) {
            // create cache object if specified
            Object.defineProperty(this, "cache", {
                enumerable: true,
                value: Toshihiko.createCache(this.options.cache)
            });
        } else if(this.parent.cache && this.options.cache === undefined) {
            // use global cache object if NOT specified
            Object.defineProperty(this, "cache", {
                enumerable: true,
                value: this.parent.cache
            });
        } else {
            // use NO cache
            Object.defineProperty(this, "cache", {
                enumerable: true,
                value: null
            });
        }

        // some key maps
        Object.defineProperties(this, {
            nameToColumn: { value: {} },
            columnToName: { value: {} },
            fieldColumnsMap: { value: {} },
            fieldNamesMap: { value: {} }
        });
        this.schema.forEach(field => {
            this.nameToColumn[field.name] = field.column;
            this.columnToName[field.column] = field.name;
            this.fieldColumnsMap[field.column] = field;
            this.fieldNamesMap[field.name] = field;
        });

        // be compatible with 0.x
        Object.defineProperty(this, "_fieldsKeyMap", {
            value: {
                n2c: this.nameToColumn,
                c2n: this.columnToName,
                name: this.fieldNamesMap,
                column: this.fieldColumnsMap
            }
        });

        debug(`"${this.name}" created.`, this);
    }

    /**
     * be compatible with 0.x
     */
    get _fields() {
        return this.schema;
    }

    /**
     * be compatible with 0.x
     */
    get toshihiko() {
        return this.parent;
    }

    build(fields) {
        const yukari = new Yukari(this, "new");
        yukari.buildNewRow(fields);
        return yukari;
    }

    where(condition) {
        return (new Query(this)).where(condition);
    }

    field(fields) {
        return (new Query(this)).fields(fields);
    }

    fields(fields) {
        return (new Query(this)).fields(fields);
    }

    limit(limit) {
        if(arguments.length <= 1) return (new Query(this)).limit(limit);
        const query = new Query(this);
        return query.limit.apply(query, arguments);
    }

    index(idx) {
        return (new Query(this)).index(idx);
    }

    order(order) {
        return (new Query(this)).order(order);
    }

    orderBy(order) {
        return (new Query(this)).orderBy(order);
    }

    count(callback) {
        return (new Query(this)).count(callback);
    }

    find(callback, toJSON, single) {
        return (new Query(this)).find(callback, toJSON, single);
    }

    findById(id, callback, toJSON) {
        return (new Query(this)).findById(id, callback, toJSON);
    }

    findOne(callback, toJSON) {
        return (new Query(this)).findOne(callback, toJSON);
    }

    update(data, callback) {
        return (new Query(this)).update(data, callback);
    }

    delete(callback) {
        return (new Query(this)).delete(callback);
    }

    execute() {
        const query = new Query(this);
        return query.execute.apply(query, arguments);
    }

    convertColumnToName(object) {
        if(typeof object === "string") {
            return this.columnToName[object];
        }

        if(Array.isArray(object)) {
            return object.map(o => this.columnToName[o]);
        }

        if(typeof object === "object") {
            const result = {};
            for(let key in object) {
                if(!object.hasOwnProperty(key)) continue;
                const temp = this.convertColumnToName(key);
                if(undefined === temp) continue;
                result[temp] = object[key];
            }
            return result;
        }

        return undefined;
    }

    /**
     * be compatible with 0.x
     */
    getPrimaryKeysName() {
        if(!this.primaryKeys.length) return [];
        if(this.primaryKeys.length === 1) return this.primaryKeys[0].name;
        return this.primaryKeys.map(pri => pri.name);
    }

    /**
     * be compatible with 0.x
     */
    getPrimaryKeysColumn() {
        if(!this.primaryKeys.length) return [];
        if(this.primaryKeys.length === 1) return this.primaryKeys[0].column;
        return this.primaryKeys.map(pri => pri.column);
    }
}

module.exports = ToshihikoModel;
