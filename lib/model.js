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
            schema: {
                enumerable: true,
                value: schema.map(options => {
                    const field = new Field(options);
                    if(field.primaryKey) {
                        this.primaryKeys.push(field);
                    }

                    if(field.autoIncrement) this.ai = field;

                    return field;
                })
            },
            options: {
                value: options || {}
            }
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

        debug(`"${this.name}" created.`, this);
    }

    /**
     * be compatible with 0.x
     */
    get toshihiko() {
        return this.parent;
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
        return (new Query(this)).limit(limit);
    }

    order(order) {
        return (new Query(this)).order(order);
    }

    orderBy(order) {
        return (new Query(this)).orderBy(order);
    }

    find(callback, toJSON, single) {
        return (new Query(this)).find(callback, toJSON, single);
    }
}

module.exports = ToshihikoModel;
