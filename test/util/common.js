/**
 * XadillaX created at 2016-08-11 18:39:14 With ♥
 *
 * Copyright (c) 2018 XadillaX, all rights
 * reserved.
 */
"use strict";

const Type = require("../../lib/field_type");

process.on("unhandledRejection", function() {
    // ... do nothing
});

module.exports = {
    COMMON_SCHEMA: [
        { name: "key1", column: "id", primaryKey: true, type: Type.Integer, autoIncrement: true },
        {
            name: "key2",
            type: Type.Float,
            defaultValue: 0.44,
            validators: [
                function(v) {
                    if(v > 100) return "`key2` can't be greater than 100";
                },
                function(v) {
                    if(v < -100) return "`key2` can't be smaller than -100";
                }
            ]
        },
        { name: "key3", type: Type.Json, defaultValue: {} },
        { name: "key4", type: Type.String, defaultValue:"Ha!", allowNull: true },
        { name: "key5", type: Type.Datetime },
        { name: "key6", type: {
            name: "Bin",
            parse: function(v) {
                return { dec: parseInt(v, 2) };
            },
            restore: function(v) {
                return `BIN(${parseInt(v.dec)})`;
            },
            needQuotes: false,
            equal: function(a, b) {
                return a.dec === b.dec;
            }
        }, validators: function(v, callback) {
            if(v.dec < -100) return callback(new Error("`key6` can't be smaller than -100"));
            return callback();
        } }
    ],

    COMMON_SCHEMA_SQL: "CREATE TABLE IF NOT EXISTS `test1` ( \
      `id` int(11) unsigned NOT NULL AUTO_INCREMENT, \
      `key2` float NOT NULL, \
      `key3` longtext NOT NULL, \
      `key4` varchar(255) DEFAULT NULL, \
      `key5` datetime NOT NULL, \
      `key6` varchar(512) NOT NULL DEFAULT '', \
      PRIMARY KEY (`id`) \
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

    COMMON_SCHEMA_AI_IS_NOT_PRIMARY: [
        { name: "key1", column: "id", type: Type.Integer, autoIncrement: true },
        {
            name: "key2",
            type: Type.Float,
            defaultValue: 0.44,
            validators: [
                function(v) {
                    if(v > 100) return "`key2` can't be greater than 100";
                }
            ]
        },
        { name: "key3", type: Type.Json, defaultValue: {} },
        { name: "key4", type: Type.String, defaultValue:"Ha!", allowNull: true, primaryKey: true },
        { name: "key5", type: Type.Datetime },
        { name: "key6", type: {
            name: "Bin",
            parse: function(v) {
                return { dec: parseInt(v, 2) };
            },
            restore: function(v) {
                return `BIN(${parseInt(v.dec)})`;
            },
            needQuotes: false
        } }
    ],

    COMMON_SCHEMA_MULTI_PRIMARY: [
        { name: "key1", column: "id", type: Type.Integer, autoIncrement: true, primaryKey: true },
        {
            name: "key2",
            type: Type.Float,
            defaultValue: 0.44,
            validators: [
                function(v) {
                    if(v > 100) return "`key2` can't be greater than 100";
                }
            ]
        },
        { name: "key3", type: Type.Json, defaultValue: {} },
        { name: "key4", type: Type.String, defaultValue:"Ha!", allowNull: true, primaryKey: true },
        { name: "key5", type: Type.Datetime },
        { name: "key6", type: {
            name: "Bin",
            parse: function(v) {
                return { dec: parseInt(v, 2) };
            },
            restore: function(v) {
                return `BIN(${parseInt(v.dec)})`;
            },
            needQuotes: false
        } }
    ],

    COMMON_SCHEMA_NO_PRIMARY: [
        { name: "key1", column: "id", type: Type.Integer, autoIncrement: true },
        {
            name: "key2",
            type: Type.Float,
            defaultValue: 0.44,
            validators: [
                function(v) {
                    if(v > 100) return "`key2` can't be greater than 100";
                }
            ]
        },
        { name: "key3", type: Type.Json, defaultValue: {} },
        { name: "key4", type: Type.String, defaultValue:"Ha!", allowNull: true },
        { name: "key5", type: Type.Datetime },
        { name: "key6", type: {
            name: "Bin",
            parse: function(v) {
                return { dec: parseInt(v, 2) };
            },
            restore: function(v) {
                return `BIN(${parseInt(v.dec)})`;
            },
            equal: function(a, b) {
                return a.dec === b.dec;
            },
            needQuotes: false
        } }
    ],

    NO_AI_SCHEMA_SQL: "CREATE TABLE IF NOT EXISTS `test2` ( \
        `id` int(11) unsigned NOT NULL, \
        `key2` float NOT NULL, \
        PRIMARY KEY (`id`) \
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

    NO_AI_SCHEMA: [
        { name: "key1", column: "id", type: Type.Integer, primaryKey: true },
        { name: "key2", type: Type.Float, defaultValue: 0.44 }
    ],

    NO_AI_SCHEMA_WITH_NO_PRIMARY: [
        { name: "key1", column: "id", type: Type.Integer },
        { name: "key2", type: Type.Float, defaultValue: 0.44 }
    ],

    DUMMY_CONN: {
        query: function() {
            return arguments[arguments.length - 1](undefined, "hello");
        }
    },

    DUMMY_CONN_WITH_ERR: {
        query: function() {
            return arguments[arguments.length - 1](new Error("dummy"));
        }
    }
};
