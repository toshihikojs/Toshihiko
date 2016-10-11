/**
 * XadillaX created at 2016-08-28 16:49:05 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const _ = require("lodash");
const async = require("async");

const FieldType = require("./field_type");

const _emptyCallback = function() {};

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
            _fieldAt: { value: this.fieldIndex },
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

    fieldIndex(name) {
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

    validateOne(name, value, callback) {
        const self = this;
        const fieldIdx = this.fieldIndex(name);
        if(-1 === fieldIdx) {
            return callback(new Error(`No such field ${name}`));
        }

        const field = this.$schema[fieldIdx];

        if(null === value) {
            return callback(field.allowNull ? undefined : new Error(`Field ${name} can't be null.`));
        }

        if(!field.validators.length) {
            return callback();
        }

        let err;
        let i = 0;
        async.whilst(
            () => (!err && i < field.validators.length),
            function(callback) {
                const validator = field.validators[i++];
                if(validator.length <= 1) {
                    const result = (validator.bind(self.$model))(value);
                    if(typeof result === "string" && result.length) {
                        err = new Error(result);
                        return callback(err);
                    }
                } else {
                    return (validator.bind(self.$model))(value, function(_err) {
                        if(_err) {
                            err = _err;
                        }

                        return callback(err);
                    });
                }
                callback();
            },
            function() {
                return callback(err);
            });
    }

    validateAll(callback) {
        const self = this;
        async.eachLimit(Object.keys(this), 10, function(key, callback) {
            if(!self.hasOwnProperty(key)) return callback();
            if(key && (key[0] === "$" || typeof self[key] === "function" || self.fieldIndex(key) === -1)) {
                return callback();
            }

            self.validateOne(key, self[key], function(err) {
                return callback(err);
            });
        }, function(err) {
            return callback(err);
        });
    }

    delete(callback) {
        if(callback === undefined) callback = _emptyCallback;

        if(this.$source === "new") {
            return callback(new Error("You must call this function via a new Yukari object."));
        }

        let pk;
        if(this.$model.primaryKeys.length) {
            // if it has primary key(s), use primary key(s) to query
            pk = this.$model.primaryKeys.reduce((pks, field) => {
                if(this.$origData[field.name]) {
                    pks[field.name] = this.$origData[field.name].data;
                }
                return pks;
            }, {});
        } else {
            // if no primary key, use all original data to query
            pk = Object.keys(this.$origData).reduce((pks, key) => {
                pks[key] = this.$origData[key].data;
                return pks;
            }, {});
        }

        this.$model.where(pk).limit("0, 1").delete(function(err, result, sql) {
            if(err) return callback(err);
            if(!result) return callback(new Error("unknown error."));
            if(!result.affectedRows) {
                return callback(new Error("Out-dated yukari object."));
            }

            this.$source = "delete";
            return callback(undefined, true, sql);
        });
    }

    insert(callback) {
        if(callback === undefined) callback = _emptyCallback;

        if(this.$source !== "new") {
            return callback(new Error("You must call this function via a new Yukari object."));
        }

        const self = this;
        async.waterfall([
            self.validateAll.bind(self),
            self.$adapter.insert.bind(self.$adapter, self.$model, Yukari.extractAdapterData(self.$model, self))
        ], function(err, row, extra) {
            if(err) return callback(err, null, extra);

            // clone new row's data to self
            for(let key in row) {
                if(!row.hasOwnProperty(key)) continue;
                if(key && key[0] === "$" && key !== "$origData") {
                    continue;
                }

                if(typeof row[key] === "function") continue;

                self[key] = _.cloneDeep(row[key]);
            }

            return callback(undefined, self, extra);
        });
    }

    update(callback) {
        if(callback === undefined) callback = _emptyCallback;

        if(this.$source === "new") {
            return callback(new Error("You must call this function via an old Yukari object."));
        }

        // get all the data changed and pass to adapter
        const model = this.$model;
        let data = [];
        for(let key in this) {
            if(!this.hasOwnProperty(key)) continue;
            if(key.length && key[0] === "$") continue;
            if(typeof this[key] === "function") continue;
            const field = model.fieldNamesMap[key];
            if(undefined === field) continue;

            // judge if this data changed since read from the data source
            const equalFunc = (undefined === field.type.equal) ?
                FieldType.$equal.bind(FieldType) :
                field.type.equal.bind(field.type);

            // allow null and new or old is null
            if((null === this[key] || null === this.$origData[key].data) &&
                this[key] !== this.$origData[key].data && field.allowNull) {
                data.push({ field: field, value: this[key] });
                continue;
            }

            // if data changed
            if(!equalFunc(this[key], this.$origData[key].data)) {
                data.push({ field: field, value: this[key] });
                continue;
            }
        }

        // FIX: if no data changed, change all data
        if(!_.size(data)) data = Yukari.extractAdapterData(model, this);

        let pk;
        if(this.$model.primaryKeys.length) {
            // if it has primary key(s), use primary key(s) to query
            pk = this.$model.primaryKeys.reduce((pks, field) => {
                if(this.$origData[field.name]) {
                    pks[field.name] = this.$origData[field.name].data;
                }
                return pks;
            }, {});
        } else {
            // if no primary key, use all original data to query
            pk = Object.keys(this.$origData).reduce((pks, key) => {
                pks[key] = this.$origData[key].data;
                return pks;
            }, {});
        }

        const self = this;
        async.waterfall([
            self.validateAll.bind(self),
            self.$adapter.update.bind(self.$adapter, self.$model, pk, data)
        ], function(err, extra) {
            if(err) return callback(err);
            
            // update this yukari data
            for(let key in data) {
                if(!data.hasOwnProperty(key)) continue;

                const d = data[key];
                self.$origData[d.field.name].data = d.value;
            }
            self.$source = "query";

            callback(err, self, extra);
        });
    }

    save(callback) {
        if(undefined === callback) callback = _emptyCallback;
        if(this.$source === "new") {
            return this.insert(callback);
        } else {
            return this.update(callback);
        }
    }

    toJSON(old) {
        const obj = old ? this.$origData : this;
        const result = {};

        for(let key in obj) {
            if(!obj.hasOwnProperty(key)) continue;
            if(key.length && key[0] !== "$" && typeof obj[key] !== "function") {
                result[key] = obj[key];

                // if it has a certain `toJSON` function
                // call it!
                const idx = this.fieldIndex(key);
                if(idx !== -1 && typeof this.$schema[idx].type.toJSON === "function") {
                    result[key] = this.$schema[idx].type.toJSON(result[key]);
                }
            }
        }

        return result;
    }
}

Yukari.extractAdapterData = function(model, dataInYukari) {
    // let it be
    // [ { field: foo, value: bar }, ... ]
    return Object.keys(dataInYukari).reduce((data, key) => {
        if(!dataInYukari.hasOwnProperty(key)) return data;
        if(key.length && key[0] === "$") return data;
        const field = model.fieldNamesMap[key];
        if(undefined === field) return data;

        data.push({
            field: field,
            value: dataInYukari[key]
        });
        return data;
    }, []);
};

module.exports = Yukari;
