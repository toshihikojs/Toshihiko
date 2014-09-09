/**
 * XadillaX created at 2014-09-09 14:21
 *
 * Copyright (c) 2014 Huaban.com, all rights
 * reserved.
 */
var mysql = require("mysql");
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
};

/**
 * initialize row
 * @param row
 * @private
 */
Yukari.prototype._initRow = function(row) {
    for(var i = 0; i < this.$fields.length; i++) {
        var field = this.$fields[i];
        if(undefined === row[field.name]) continue;

        this.$origData[field.alias] = {
            fieldIdx    : i,
            data        : field.type.parse(row[field.name])
        };
    }

    for(var key in this.$origData) {
        this[key] = Object.clone(this.$origData[key].data, true);
    }
};

/**
 * field at
 * @param name
 * @returns {*}
 * @private
 */
Yukari.prototype._fieldAt = function(name) {
    if(this.$origData[name]) {
        return this.$origData[name].fieldIdx;
    }
    return -1;
};

/**
 * save / insert a record
 * @param callback
 */
Yukari.prototype.save = function(callback) {
    if(undefined === callback) callback = function(){};

    var data = {};

    for(var key in this) {
        if(key[0] === "$") continue;

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
        return;
    }

    // set data
    var sql = "UPDATE `{table}` SET ?";
    var finalData = {};
    for(var key in data) {
        finalData[key] = data[key].field.type.restore(data[key].data);
    }

    sql = sql.assign({ table: this.$model.name });
    sql = mysql.format(sql, finalData) + " WHERE ";

    // set primary key condition
    var pk = [];
    for(var i = 0; i < this.$model.primaryKeys.length; i++) {
        var p = this.$model.primaryKeys[i];
        if(pk.length) sql += " AND ";

        sql += "`" + p.name + "` = ?";

        pk.push(p.type.restore(this.$origData[p.alias].data));
    }
    sql = mysql.format(sql, pk);

    var self = this;
    this.$toshihiko.execute(sql, function(err, results) {
        if(err) return callback(err, undefined, sql);
        if(!results.changedRows) {
            return callback(new Error("No row(s) effected."));
        }

        for(var key in data) {
            var d = data[key];
            self.$origData[d.field.alias] = d.data;
        }
        self.$source = "query";

        callback(undefined, self, sql);
    });
};

module.exports = Yukari;
