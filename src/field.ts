/**
 * Toshihiko - Field class
 */

import createDebug from "debug";
import otrans from "otrans";

import FieldType from "./field_type";
import { BaseType, FieldOptions, ValidatorFn } from "./types";

const debug = createDebug("toshihiko:field");

export class ToshihikoField {
    public readonly name: string;
    public readonly column: string;
    public readonly type: BaseType<any>;
    public readonly validators: ValidatorFn[];
    public readonly allowNull: boolean;
    public readonly primaryKey: boolean;
    public readonly autoIncrement: boolean;
    public readonly default: any;
    public readonly equal: (a: any, b: any) => boolean;

    private readonly options: FieldOptions;

    constructor(options: FieldOptions) {
        if (!options.name) {
            throw new Error("no field name specified.");
        }

        this.options = otrans.toCamel(options) as FieldOptions;
        options = this.options;

        let type = options.type;
        if (!type || typeof type.restore !== "function" || typeof type.parse !== "function") {
            type = FieldType.String;
        }

        let validators: ValidatorFn[] = [];
        if (typeof options.validators === "function") {
            options.validators = [options.validators];
        }
        if (Array.isArray(options.validators)) {
            validators = options.validators;
        }

        this.name = options.name;
        this.column = options.column || options.name;
        this.type = type;
        this.validators = validators;
        this.allowNull = !!options.allowNull;
        this.primaryKey = !!options.primaryKey;
        this.autoIncrement = options.autoIncrement !== undefined && !!options.autoIncrement;
        this.default = (options.defaultValue === undefined) ? type.defaultValue : options.defaultValue;
        this.equal = (typeof type.equal === "function") ? type.equal.bind(type) : FieldType.$equal;

        debug(`${options.name} created.`, this);
    }

    /**
     * Default value of this field
     */
    get defaultValue(): any {
        return this.default;
    }

    /**
     * Whether this field needs quotes
     */
    get needQuotes(): boolean {
        return !!this.type.needQuotes;
    }

    /**
     * Restore value
     */
    restore(value: any): any {
        return this.type.restore(value);
    }

    /**
     * Parse value
     */
    parse(value: any): any {
        return this.type.parse(value);
    }
}

export default ToshihikoField;
