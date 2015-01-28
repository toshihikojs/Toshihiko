/**
 * XadillaX created at 2014-09-09 14:21
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var mysql = require("mysql");
var async = require("async");
var fieldType = require("./fieldType");

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
    this.$memcached = model.memcached;

    this.$fromMemcached = false;
};

/**
 * get primary keys and values
 * @returns {*}
 * @private
 */
Yukari.prototype._getPrimaryKeys = function() {
    var keys = this.$model.getPrimaryKeysName();
    if(typeof keys === "string") {
        return (this[keys] === undefined) ? this.$origData[keys] : this[keys];
    }

    var obj = {};
    for(var i = 0; i < keys.length; i++) {
        obj[keys[i]] = (this[keys[i]] === undefined) ? this.$origData[keys[i]] : this[keys[i]];
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

        if(undefined === value) continue;

        this[field.name] = Object.clone(value);
    }

    if(row.$fromMemcached) this.$fromMemcached = true;
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
        if(undefined === row[name]) continue;
        this.$origData[field.name] = {
            fieldIdx    : i,
            data        : row[name] === null ? null : field.type.parse(row[name])
        };
    }

    for(var key in this.$origData) {
        this[key] = Object.clone(this.$origData[key].data, true);
    }

    if(row.$fromMemcached) this.$fromMemcached = true;
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
        if(key.length && key[0] !== '$' && typeof obj[key] !== "function") {
            result[key] = obj[key];
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
        if(key[0] === "$") continue;
        if(typeof this[key] === "function") continue;
        if(this._fieldAt(key) === -1) continue;

        var result = this.validateOne(key, this[key]);
        if(typeof result === "string" && result.length) return result;
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
        if(typeof result === "string" && result.length) return result;
    }

    return "";
};

/**
 * insert a record
 * @param callback
 * @returns {*}
 */
Yukari.prototype.insert = function(callback) {
    if(callback === undefined) callback = function(){};

    if(this.$source !== "new") {
        return callback(new Error("You must call this function via a new Yukari object."));
    }

    var vldt = this.validateAll();
    if(vldt.length) {
        return callback(new Error(vldt));
    }

    var data = {};
    for(var key in this) {
        if(key[0] === "$") continue;
        var fieldIdx = this._fieldAt(key);
        if(-1 === fieldIdx) continue;
        field = this.$fields[fieldIdx];
        if(this[key] !== null) data[field.column] = field.type.restore(this[key]);
        else this[key] = null;
    }

    var sql = "INSERT INTO `{table}` SET ?".assign({ table: this.$model.name });
    sql = mysql.format(sql, data);

    if(this.$toshihiko.options.showSql) {
        console.log("❤️ Toshihiko is executing SQL: 【" + sql + "】...");
    }

    var self = this;
    this.$toshihiko.execute(sql, function(err, row) {
        if(err) return callback(err, undefined, sql);
        if(!row) return callback(new Error("Now row inserted."), undefined, sql);

        self.$source = "query";

        var where = {};
        var pk = self.$model.primaryKeys;
        if(row.insertId) {
            where[pk[0].name] = row.insertId;
        } else {
            for(var i = 0; i < self.$model.primaryKeys.length; i++) {
                where[pk[0].name] = self[pk[0].name];
            }
        }

        self.$model.where(where).findOne(function(err, row) {
            if(err) {
                return callback(new Error("Insert successfully but failed to read the record: " + err.message));
            }

            if(!row) {
                return callback(new Error("Insert successfully but failed to read the record: Unknown error."));
            }

            for(var key in row) {
                if(key[0] === '$' && key !== "$origData") continue;
                if(typeof row[key] === "function") continue;

                self[key] = Object.clone(row[key], true);
            }

            callback(undefined, self, sql);
        });
    });
};

/**
 * updata a record
 * @param callback
 * @returns {*}
 */
Yukari.prototype.update = function(callback) {
    if(undefined === callback) callback = function(){};

    if(this.$source !== "query") {
        return callback(new Error("You must call this function via a Yukari object which is queried."));
    }

    var vldt = this.validateAll();
    if(vldt.length) {
        return callback(new Error(vldt));
    }

    var data = {};

    for(var key in this) {
        if(key[0] === "$") continue;
        if(typeof this[key] === "function") continue;

        var fieldIdx = this._fieldAt(key);
        if(-1 === fieldIdx) continue;

        var field = this.$fields[fieldIdx];
        var equalFunc = (undefined === field.type.equal ? fieldType.$equal : field.type.equal);

        // only change changed data
        if(!equalFunc(this[key], this.$origData[key].data)) {
            data[field.name] = {
                data    : this[key],
                field   : field
            };
        }
    }

    if(!Object.size(data)) {
        return callback(new Error("No data changed."));
    }

    // set data
    var sql = "UPDATE `{table}` SET ?";
    var finalData = {};
    for(var key in data) {
        if(data[key].data !== null) finalData[this.$model._fieldsKeyMap.n2c[key]] = data[key].field.type.restore(data[key].data);
        else finalData[this.$model._fieldsKeyMap.n2c[key]] = null;
    }

    sql = sql.assign({ table: this.$model.name });
    sql = mysql.format(sql, finalData) + " WHERE ";

    // set primary key condition
    var pk = [];
    for(var i = 0; i < this.$model.primaryKeys.length; i++) {
        var p = this.$model.primaryKeys[i];
        if(pk.length) sql += " AND ";

        sql += "`" + p.column + "` = ?";

        pk.push(p.type.restore(this.$origData[p.name].data));
    }
    sql = mysql.format(sql, pk);

    if(this.$toshihiko.options.showSql) {
        console.log("❤️ Toshihiko is executing SQL: 【" + sql + "】...");
    }

    var self = this;
    async.waterfall([
        /**
         * step 1.
         *   if memcached...
         * @param callback
         */
        function(callback) {
            if(!self.$model.memcached) return callback();

            var primary = self._getPrimaryKeys();
            if(typeof primary === "object") self.$model.nameToColumn(primary);
            self.$memcached.deleteData(self.$dbName, self.$tableName, primary, function(err) {
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
                if(err) return callback(err);
                if(!results.changedRows) {
                    return callback(new Error("No row(s) effected."));
                }

                for(var key in data) {
                    var d = data[key];
                    self.$origData[d.field.name].data = d.data;
                }
                self.$source = "query";

                callback();
            });
        }
    ], function(err) {
        callback(err, self, sql);
    });
};

/**
 * delete this yukari
 * @param callback
 * @returns {*}
 */
Yukari.prototype.delete = function(callback) {
    if(undefined === callback) callback = function(){};

    if(this.$source === "new") {
        return callback(new Error("You must delete a queried record."));
    }

    var pk = {};
    for(var i = 0; i < this.$model.primaryKeys.length; i++) {
        var field = this.$model.primaryKeys[i];
        pk[field.name] = this.$origData[field.name].data;
    }

    /**
     * Model::where -> new Query
     * Query::delete 已经有做对 MEMCACHED 的处理，无需多处理
     */
    this.$model.where(pk).limit("0,1").delete(function(err, result, sql) {
        if(err) return callback(err, undefined, sql);
        return callback(undefined, result.affectedRows, sql);
    });
};

/**
 * save / insert a record
 * @param callback
 */
Yukari.prototype.save = function(callback) {
    if(undefined === callback) callback = function(){};

    if(this.$source === "query") {
        this.update(callback);
    } else if(this.$source === "new") {
        this.insert(callback);
    }
};

module.exports = Yukari;

