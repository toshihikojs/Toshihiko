/**
 * XadillaX created at 2016-08-09 13:04:53 With ♥
 *
 * Copyright (c) 2016 Souche.com, all rights
 * reserved.
 */
"use strict";

const debug = require("debug")("toshihiko:field");
const otrans = require("otrans");

const FieldType = require("./field_type");

class ToshihikoField {
    constructor(options) {
        if(!options.name) {
            throw new Error("no field name specified.");
        }

        Object.defineProperty(this, "options", {
            configurable: false,
            writable: false,
            enumerable: false,
            value: otrans.toCamel(options)
        });

        options = this.options;

        let type = options.type;
        if(!type || typeof type.restore !== "function" || typeof type.parse !== "function") {
            type = FieldType.String;
        }

        let validators = [];
        if(typeof options.validators === "function") {
            options.validators = [ options.validators ];
        }
        if(Array.isArray(options.validators)) {
            validators = options.validators;
        }

        Object.defineProperties(this, {
            name: { value: options.name, enumerable: true },
            column: { value: options.column || options.name, enumerable: true },
            type: { value: type, enumerable: true },
            validators: { value: validators, enumerable: true },
            allowNull: { value: !!options.allowNull, enumerable: true },

            primaryKey: { value: !!options.primaryKey, enumerable: true },
            autoIncrement: {
                value: (options.autoIncrement !== undefined && !!options.autoIncrement),
                enumerable: true 
            },

            default: {
                value: (options.defaultValue === undefined) ? type.defaultValue : options.defaultValue,
                enumerable: true
            },

            equal: {
                value: (typeof type.equal === "function") ? type.equal.bind(type) : FieldType.$equal
            }
        });

        debug(`${options.name} created.`, this);
    }

    get defaultValue() {
        return this.default;
    }

    get needQuotes() {
        return !!this.type.needQuotes;
    }

    restore(value) {
        return this.type.restore(value);
    }

    parse(value) {
        return this.type.parse(value);
    }
}

module.exports = ToshihikoField;
