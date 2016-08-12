/**
 * XadillaX created at 2016-08-11 18:39:14 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const Type = require("../../lib/field_type");

module.exports = {
    COMMON_SCHEMA: [
        { name: "key1", column: "id", primaryKey: true, type: Type.Integer },
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
            needQuotes: false
        } }
    ]
};
