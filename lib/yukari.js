/**
 * XadillaX created at 2014-09-09 14:21
 *
 * Copyright (c) 2015 Souche.com, all rights
 * reserved.
 */
"use strict";

var util = require("util");

var async = require("async");
var mysql = require("mysql2");
var 囍 = require("lodash");

var fieldType = require("./field_type");
var ResultPromisor = require("./result_promisor");

/**
 * Yakumo Yukari is the entity of Yakumo Toshihiko.
 * @param model
 * @param source
 * @constructor
 */
var Yukari = function(model, source) {
    this.$model = model;
    this.$toshihiko = model.toshihiko;

    this.$fields = model._fieldsObject;
    this.$origData = {};

    this.$source = source;

    this.$dbName = this.$toshihiko.database;
    this.$tableName = this.$model.name;
    this.$cache = model.cache;

    this.$fromCache = false;
};

/**
 * get primary keys and values
 * @param {Boolean} [fromOrig] is primary keys from original data
 * @returns {*}
 * @private
 */
Yukari.prototype._getPrimaryKeys = function(fromOrig) {
    var keys = this.$model.getPrimaryKeysName();
    if(typeof keys === "string") {
        return (fromOrig || this[keys] === undefined) ?
            this.$origData[keys].data :
            this[keys];
    }

    var obj = {};
    for(var i = 0; i < keys.length; i++) {
        obj[keys[i]] = (fromOrig || this[keys[i]] === undefined) ?
            this.$origData[keys[i]].data :
            this[keys[i]];
    }
    return obj;
};

/**
 * build row
 * @param row
 * @param useOrigName
 * @private
 */
Yukari.prototype._buildRow = function(row, useOrigName) {
    this.$origData = {};

    for(var i = 0; i < this.$fields.length; i++) {
        var field = this.$fields[i];
        var value = row[useOrigName ? field.column : field.name];

        if(undefined === value) {
            if(undefined !== field.defaultValue) {
                value = field.defaultValue;
            }
        }

        if(undefined === value) {
            continue;
        }

        this[field.name] = 囍.clone(value);
    }

    if(row.$fromCache) {
        this.$fromCache = true;
    }
};

/**
 * initialize row
 * @param row
 * @param useOrigName
 * @private
 */
Yukari.prototype._initRow = function(row, useOrigName) {
    for(var i = 0; i < this.$fields.length; i++) {
        var field = this.$fields[i];
        var name = useOrigName ? field.column : field.name;
        if(undefined === row[name]) {
            continue;
        }

        this.$origData[field.name] = {
            fieldIdx : i,
            data     : row[name] === null ? null : field.type.parse(row[name])
        };
    }

    for(var key in this.$origData) {
        if(!this.$origData.hasOwnProperty(key)) {
            continue;
        }

        this[key] = 囍.clone(this.$origData[key].data, true);
    }

    if(row.$fromCache) {
        this.$fromCache = true;
    }
};

/**
 * to json object
 * @param [old]
 * @returns {{}}
 */
Yukari.prototype.toJSON = function(old) {
    var obj = old ? this.$origData : this;
    var result = {};
    for(var key in obj) {
        if(key.length && key[0] !== "$" && typeof obj[key] !== "function") {
            result[key] = obj[key];

            // if it has a certain `toJSON` function
            var idx = this._fieldAt(key);
            if(idx !== -1 && typeof this.$fields[idx].type.toJSON === "function") {
                result[key] = this.$fields[idx].type.toJSON(result[key]);
            }
        }
    }

    return result;
};

/**
 * field at
 * @param name
 * @returns {*}
 * @private
 */
Yukari.prototype._fieldAt = function(name) {
    if(this.$source !== "new" && this.$origData[name]) {
        return this.$origData[name].fieldIdx;
    } else if(this.$source === "new") {
        for(var i = 0; i < this.$fields.length; i++) {
            if(this.$fields[i].name === name) {
                return i;
            }
        }
    }

    return -1;
};

/**
 * validate all fields
 * @returns {*}
 */
Yukari.prototype.validateAll = function() {
    for(var key in this) {
        if(!this.hasOwnProperty(key)) {
            continue;
        }

        if(key[0] === "$" ||
            typeof this[key] === "function" ||
            this._fieldAt(key) === -1) {
            continue;
        }

        var result = this.validateOne(key, this[key]);
        if(typeof result === "string" && result.length) {
            return result;
        }
    }

    return "";
};

/**
 * validate one field
 * @param name
 * @param value
 * @returns {*}
 */
Yukari.prototype.validateOne = function(name, value) {
    var fieldIdx = this._fieldAt(name);
    if(-1 === fieldIdx) {
        return "No such field.";
    }

    var field = this.$fields[fieldIdx];

    if(null === value && !field.allowNull) {
        return "Field " + name + " can't be NULL.";
    } else if(null === value && field.allowNull) {
        return "";
    }

    for(var i = 0; i < field.validators.length; i++) {
        var result = field.validators[i](value);
        if(typeof result === "string" && result.length) {
            return result;
        }
    }

    return "";
};

/**
 * insert a record
 * @param callback
 * @returns {*}
 */
Yukari.prototype.insert = function(callback) {
    var promise = new ResultPromisor();
    if(callback === undefined) {
        callback = function() {};
    }

    if(this.$source !== "new") {
        callback(new Error(
            "You must call this function via a new Yukari object."));

        promise._onExecuteResult(new Error(
            "You must call this function via a new Yukari object."));

        return promise;
    }

    var vldt = this.validateAll();
    if(vldt.length) {
        callback(new Error(vldt));
        promise._onExecuteResult(new Error(vldt));
        return promise;
    }

    var data = {};
    for(var key in this) {
        if(!this.hasOwnProperty(key)) {
            continue;
        }
        
        if(key[0] === "$") {
            continue;
        }

        var fieldIdx = this._fieldAt(key);

        if(-1 === fieldIdx) {
            continue;
        }

        var field = this.$fields[fieldIdx];
        if(this[key] !== null) {
            data[field.column] = field.type.restore(this[key]);
        } else {
            this[key] = null;
        }
    }

    var sql = util.format("INSERT INTO `%s` SET ?", this.$model.name);
    sql = mysql.format(sql, data);

    if(this.$toshihiko.options.showSql) {
        console.log("❤️ Toshihiko is executing SQL: 【" + sql + "】...");
    }

    var self = this;
    this.$toshihiko.execute(sql, function(err, row) {
        if(err) {
            callback(err, undefined, sql);
            promise._onExecuteResult(err, undefined, sql);
            return promise;
        }

        if(!row) {
            callback(new Error("No row inserted."), undefined, sql);
            promise._onExecuteResult(
                new Error("No row inserted."),
                undefined,
                sql);
            return promise;

        }

        self.$source = "query";

        var where = {};
        var pk = self.$model.primaryKeys;
        var ai = self.$model.ai;
        if(row.insertId) {
            // 只有一个主键
            if(pk.length === 1) {
                if(!ai || ai.primaryKey) {
                    // Model 没定义过 AI，或者定义的 AI 就是主键
                    where[pk[0].name] = row.insertId;
                } else {
                    // Model 定义过 AI 且不是主键
                    where[pk[0].name] = (self[pk[0].name] !== undefined) ?
                        self[pk[0].name] : self[pk[0].column];
                }
            } else {
                // 有多个主键
                
                for(var i = 0; i < pk.length; i++) {
                    where[pk[i].name] = (self[pk[i].name] !== undefined) ?
                        self[pk[i].name] : self[pk[i].column];
                }

                // 如果有 AI 主键那么覆盖一下
                if(ai && ai.primaryKey) {
                    self[ai.name] = row.insertId;
                }
            }
        } else {
            for(var i = 0; i < pk.length; i++) {
                where[pk[i].name] = (self[pk[i].name] !== undefined) ?
                    self[pk[i].name] : self[pk[i].column];
            }
        }

        self.$model.where(where).findOne(function(err, row) {
            if(err) {
                callback(new Error(
                    "Insert successfully but failed to read the record: " + err.message));
                promise._onExecuteResult(new Error(
                    "Insert successfully but failed to read the record: " + err.message));
                return promise;
            }

            if(!row) {
                callback(new Error(
                    "Insert successfully but failed to read the record: Unknown error."));
                promise._onExecuteResult(new Error(
                    "Insert successfully but failed to read the record: Unknown error."));
                return promise;
            }

            for(var key in row) {
                if(!row.hasOwnProperty(key)) {
                    continue;
                }

                if(key[0] === "$" && key !== "$origData") {
                    continue;
                }

                if(typeof row[key] === "function") {
                    continue;
                }

                self[key] = 囍.clone(row[key], true);
            }

            callback(undefined, self, sql);
            promise._onExecuteResult(undefined, self, sql);
        });
    });
    return promise;
};

/**
 * updata a record
 * @param callback
 * @returns {*}
 */
Yukari.prototype.update = function(callback) {
    var promise = new ResultPromisor();
    if(undefined === callback) {
        callback = function() {};
    }

    if(this.$source !== "query") {
        callback(new Error(
            "You must call this function via a Yukari object which is queried."));
        promise._onExecuteResult(new Error(
            "You must call this function via a Yukari object which is queried."));
        return promise;
    }

    var vldt = this.validateAll();
    if(vldt.length) {
        callback(new Error(vldt));
        promise._onExecuteResult(new Error(vldt));
        return promise;
    }

    var data = {};

    for(var key in this) {
        if(!this.hasOwnProperty(key)) {
            continue;
        }

        if(key[0] === "$") {
            continue;
        }

        if(typeof this[key] === "function") {
            continue;
        }

        var fieldIdx = this._fieldAt(key);
        if(-1 === fieldIdx) {
            continue;
        }

        var field = this.$fields[fieldIdx];
        var equalFunc = ((undefined === field.type.equal) ?
            fieldType.$equal.bind(fieldType) :
            field.type.equal.bind(field.type));

        // only change changed data
        if(!equalFunc(this[key], this.$origData[key].data)) {
            data[field.name] = {
                data    : this[key],
                field   : field
            };
        }
    }

    // FIX: if no data changed, then change all data
    if(!囍.size(data)) {
        for(var key in this) {
            if(!this.hasOwnProperty(key)) continue;
            if(key[0] === "$") continue;
            if(typeof this[key] === "function") continue;

            var fieldIdx = this._fieldAt(key);
            if(-1 === fieldIdx) continue;

            var field = this.$fields[fieldIdx];
            data[field.name] = {
                data: this[key],
                field: field
            };
        }
    }

    // set data
    var sql = "UPDATE `%s` SET ?";
    var finalData = {};
    for(var key in data) {
        if(!data.hasOwnProperty(key)) continue;

        var n2c = this.$model._fieldsKeyMap.n2c[key];
        if(data[key].data !== null) {
            finalData[n2c] = data[key].field.type.restore(data[key].data);
        } else {
            finalData[n2c] = null;
        }
    }

    sql = util.format(sql, this.$model.name);
    sql = mysql.format(sql, finalData) + " WHERE ";

    // set primary key condition
    var conditionSql = "";
    var pk = [];
    for(var i = 0; i < this.$model.primaryKeys.length; i++) {
        var p = this.$model.primaryKeys[i];
        if(pk.length) {
            conditionSql += " AND ";
        }

        conditionSql += "`" + p.column + "` = ?";

        pk.push(p.type.restore(this.$origData[p.name].data));
    }
    sql += mysql.format(conditionSql, pk);

    if(this.$toshihiko.options.showSql) {
        console.log("❤️ Toshihiko is executing SQL: 【" + sql + "】...");
    }

    var self = this;
    async.waterfall([
        /**
         * step 1.
         *   if cache...
         * @param callback
         */
        function(callback) {
            if(!self.$cache) {
                return callback();
            }

            var primary = self._getPrimaryKeys(true);
            if(typeof primary === "object") {
                self.$model.nameToColumn(primary);
            }

            self.$cache.deleteData(
                self.$dbName,
                self.$tableName,
                primary,
                function(err) {
                    callback(err);
                });
        },

        /**
         * step 2.
         *   edit 本体...
         * @param callback
         */
        function(callback) {
            self.$toshihiko.execute(sql, function(err, results) {
                if(err) {
                    return callback(err);
                }

                if(!results.affectedRows) {
                    return callback(new Error("No row(s) effected."));
                }

                for(var key in data) {
                    if(!data.hasOwnProperty(key)) {
                        continue;
                    }

                    var d = data[key];
                    self.$origData[d.field.name].data = d.data;
                }
                self.$source = "query";

                callback();
            });
        }
    ], function(err) {
        callback(err, self, sql);
        promise._onExecuteResult(err, self, sql);
    });
    return promise;
};

/**
 * update by json
 * @param jsonData 
 * @param callback
 */
Yukari.prototype.updateByJson = function(jsonData, callback) {
    if ("function" === typeof jsonData) {
        callback = jsonData;
        jsonData = {};
    }
    if (typeof jsonData !== "object") {
        return callback(new Error("Json data is not object"));
    }

    for (var key in jsonData) {
        if(!this.hasOwnProperty(key)) {
            continue;
        }
        var fieldIdx = this._fieldAt(key);
        if(-1 === fieldIdx) {
            continue;
        }
        this[key] = jsonData[key];
    }
    return this.update(callback);
};

/**
 * delete this yukari
 * @param callback
 * @returns {*}
 */
Yukari.prototype.delete = function(callback) {
    var promise = new ResultPromisor();
    if(undefined === callback) {
        callback = function(){};
    }

    if(this.$source === "new") {
        callback(new Error("You must delete a queried record."));
        promise._onExecuteResult(new Error("You must delete a queried record."));
        return promise;
    }

    var pk = {};
    for(var i = 0; i < this.$model.primaryKeys.length; i++) {
        var field = this.$model.primaryKeys[i];
        pk[field.name] = this.$origData[field.name].data;
    }

    /**
     * Model::where -> new Query
     * Query::delete 已经有做对 CACHE 的处理，无需多处理
     */
    this.$model.where(pk).limit("0,1").delete(function(err, result, sql) {
        if(err) {
            callback(err, undefined, sql);
            promise._onExecuteResult(err, undefined, sql);
        }

        callback(undefined, result.affectedRows, sql);
        promise._onExecuteResult(undefined, result.affectedRows, sql);
    });
    return promise;
};

/**
 * save / insert a record
 * @param callback
 */
Yukari.prototype.save = function(callback) {
    if(undefined === callback) {
        callback = function() {};
    }

    if(this.$source === "query") {
        return this.update(callback);
    } else if(this.$source === "new") {
        return this.insert(callback);
    }
};

module.exports = Yukari;
