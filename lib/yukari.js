/**
 * XadillaX created at 2016-08-28 16:49:05 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const _ = require("lodash");

class Yukari {
    constructor(model, source) {
        Object.defineProperties(this, {
            $model: { value: model },
            $toshihiko: { value: model.parent },
            $schema: { value: model.schema },
            $origData: { value: {}, writable: true },
            $source: { value: source, writable: true },
            $dbName: { value: model.parent.database },
            $tabelName: { value: model.name },
            $cache: { value: model.cache },
            $fromCache: { value: false, writable: true },

            $adapter: { value: model.parent.adapter },

            // to be compatible with elder versions
            _initRow: { value: this.fillRowFromSomewhere },
            _buildRow: { value: this.buildNewRow },
            _fieldAt: { value: this.fieldAt }
        });
    }

    fillRowFromSource(row, rowInOrigName) {
        // fill in the original data
        this.$origData = {};
        for(let i = 0; i < this.$schema.length; i++) {
            const field = this.$schema[i];
            const colName = rowInOrigName ? field.column : field.name;

            // if no fit column, we continue
            if(undefined === row[colName]) continue;

            this.$origData[field.name] = {
                fieldIdx: i,
                data: row[colName] === null ? null : field.type.parse(row[colName])
            };
        }

        // fill in the data fields
        for(let key in this.$origData) {
            if(!this.$origData.hasOwnProperty(key)) continue;
            Object.defineProperty(this, key, {
                enumerable: true,
                configurable: false,
                writable: true,
                value: _.cloneDeep(this.$origData[key].data)
            });
        }

        if(row.$fromCache) {
            this.$fromCache = true;
        }
    }

    buildNewRow(row, rowInOrigName) {
        // clear the original data
        this.$origData = {};

        // fill in the data
        for(let i = 0; i < this.$schema.length; i++) {
            let field = this.$schema[i];
            let value = row[rowInOrigName ? field.column : field.name];

            // if no this field specified in `row`,
            // we use the default value
            if(undefined === value && undefined !== field.defaultValue) {
                value = field.defaultValue;
            }

            // if still undefined
            // we continue
            if(undefined === value) continue;

            Object.defineProperty(this, field.name, {
                enumerable: true,
                configurable: false,
                writable: true,
                value: _.cloneDeep(value)
            });
        }

        if(row.$fromCache) {
            this.$fromCache = true;
        }
    }

    fieldAt(name) {
        if(this.$source !== "new" && this.$origData[name]) {
            return this.$origData[name].fieldIdx;
        } else if(this.$source === "new") {
            for(let i = 0; i < this.$schema.length; i++) {
                if(this.$schema[i].name === name) {
                    return i;
                }
            }
        }

        return -1;
    }
}

module.exports = Yukari;
