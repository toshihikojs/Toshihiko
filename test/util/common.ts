/**
 * Toshihiko - Test utilities - Common schemas
 */

import Type from "../../src/field_type";

process.on("unhandledRejection", function () {
    // ... do nothing
});

export const COMMON_SCHEMA = [
    { name: "key1", column: "id", primaryKey: true, type: Type.Integer, autoIncrement: true },
    {
        name: "key2",
        type: Type.Float,
        defaultValue: 0.44,
        validators: [
            function (v: number) {
                if (v > 100) return "`key2` can't be greater than 100";
            },
            function (v: number) {
                if (v < -100) return "`key2` can't be smaller than -100";
            },
        ],
    },
    { name: "key3", type: Type.Json, defaultValue: {} },
    { name: "key4", type: Type.String, defaultValue: "Ha!", allowNull: true },
    { name: "key5", type: Type.Datetime },
    {
        name: "key6",
        type: {
            name: "Bin",
            parse: function (v: string) {
                return { dec: parseInt(v, 2) };
            },
            restore: function (v: any) {
                return `BIN(${parseInt(v.dec, 10)})`;
            },
            needQuotes: false,
            equal: function (a: any, b: any) {
                return a.dec === b.dec;
            },
        },
        validators: function (v: any, callback: any) {
            if (v.dec < -100) return callback(new Error("`key6` can't be smaller than -100"));
            return callback();
        },
    },
];

export const COMMON_SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS \`test1\` (
  \`id\` int(11) unsigned NOT NULL AUTO_INCREMENT,
  \`key2\` float NOT NULL,
  \`key3\` longtext NOT NULL,
  \`key4\` varchar(255) DEFAULT NULL,
  \`key5\` datetime NOT NULL,
  \`key6\` varchar(512) NOT NULL DEFAULT '',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

export const COMMON_SCHEMA_AI_IS_NOT_PRIMARY = [
    { name: "key1", column: "id", type: Type.Integer, autoIncrement: true },
    {
        name: "key2",
        type: Type.Float,
        defaultValue: 0.44,
        validators: [
            function (v: number) {
                if (v > 100) return "`key2` can't be greater than 100";
            },
        ],
    },
    { name: "key3", type: Type.Json, defaultValue: {} },
    { name: "key4", type: Type.String, defaultValue: "Ha!", allowNull: true, primaryKey: true },
    { name: "key5", type: Type.Datetime },
    {
        name: "key6",
        type: {
            name: "Bin",
            parse: function (v: string) {
                return { dec: parseInt(v, 2) };
            },
            restore: function (v: any) {
                return `BIN(${parseInt(v.dec, 10)})`;
            },
            needQuotes: false,
        },
    },
];

export const COMMON_SCHEMA_MULTI_PRIMARY = [
    { name: "key1", column: "id", type: Type.Integer, autoIncrement: true, primaryKey: true },
    {
        name: "key2",
        type: Type.Float,
        defaultValue: 0.44,
        validators: [
            function (v: number) {
                if (v > 100) return "`key2` can't be greater than 100";
            },
        ],
    },
    { name: "key3", type: Type.Json, defaultValue: {} },
    { name: "key4", type: Type.String, defaultValue: "Ha!", allowNull: true, primaryKey: true },
    { name: "key5", type: Type.Datetime },
    {
        name: "key6",
        type: {
            name: "Bin",
            parse: function (v: string) {
                return { dec: parseInt(v, 2) };
            },
            restore: function (v: any) {
                return `BIN(${parseInt(v.dec, 10)})`;
            },
            needQuotes: false,
        },
    },
];

export const COMMON_SCHEMA_NO_PRIMARY = [
    { name: "key1", column: "id", type: Type.Integer, autoIncrement: true },
    {
        name: "key2",
        type: Type.Float,
        defaultValue: 0.44,
        validators: [
            function (v: number) {
                if (v > 100) return "`key2` can't be greater than 100";
            },
        ],
    },
    { name: "key3", type: Type.Json, defaultValue: {} },
    { name: "key4", type: Type.String, defaultValue: "Ha!", allowNull: true },
    { name: "key5", type: Type.Datetime },
    {
        name: "key6",
        type: {
            name: "Bin",
            parse: function (v: string) {
                return { dec: parseInt(v, 2) };
            },
            restore: function (v: any) {
                return `BIN(${parseInt(v.dec, 10)})`;
            },
            equal: function (a: any, b: any) {
                return a.dec === b.dec;
            },
            needQuotes: false,
        },
    },
];

export const NO_AI_SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS \`test2\` (
    \`id\` int(11) unsigned NOT NULL,
    \`key2\` float NOT NULL,
    PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

export const NO_AI_SCHEMA = [
    { name: "key1", column: "id", type: Type.Integer, primaryKey: true },
    { name: "key2", type: Type.Float, defaultValue: 0.44 },
];

export const NO_AI_SCHEMA_WITH_NO_PRIMARY = [
    { name: "key1", column: "id", type: Type.Integer },
    { name: "key2", type: Type.Float, defaultValue: 0.44 },
];

export const DUMMY_CONN = {
    query: function (...args: any[]) {
        return args[args.length - 1](undefined, "hello");
    },
};

export const DUMMY_CONN_WITH_ERR = {
    query: function (...args: any[]) {
        return args[args.length - 1](new Error("dummy"));
    },
};

export default {
    COMMON_SCHEMA,
    COMMON_SCHEMA_SQL,
    COMMON_SCHEMA_AI_IS_NOT_PRIMARY,
    COMMON_SCHEMA_MULTI_PRIMARY,
    COMMON_SCHEMA_NO_PRIMARY,
    NO_AI_SCHEMA_SQL,
    NO_AI_SCHEMA,
    NO_AI_SCHEMA_WITH_NO_PRIMARY,
    DUMMY_CONN,
    DUMMY_CONN_WITH_ERR,
};
