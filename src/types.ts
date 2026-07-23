/**
 * Toshihiko - Yet another simple ORM for node.js
 * Type definitions
 */

export type ObjStatic = { [key: string]: any };
export type IfError = Error | undefined;
export type OnlyErrorCallback = (err?: IfError) => void;
export type ResultCallback = (err: IfError, result?: any, extra?: any) => void;

export interface BaseType<T> {
    name: string;
    needQuotes?: boolean;
    defaultValue?: T;

    restore(parsed: any): any;
    parse(orig: any): T;

    equal?: (a: any, b: any) => boolean;
    toJSON?: (a: T) => any;
}

export interface FieldOptions {
    name: string;
    column?: string;
    type?: BaseType<any>;
    primaryKey?: boolean;
    autoIncrement?: boolean;
    allowNull?: boolean;
    defaultValue?: any;
    validators?: ValidatorFn | ValidatorFn[];
}

export type ValidatorFn = (value: any, callback?: (err?: Error | string) => void) => string | void | undefined;

export interface SchemaDefinition extends FieldOptions {}

export interface ModelOptions {
    cache?: CacheOptions | CacheInstance | null;
    [key: string]: any;
}

export interface CacheOptions {
    module?: any;
    path?: string;
    name?: string;
    [key: string]: any;
}

export interface CacheInstance {
    getData(database: string, table: string, keys: any, callback: (err: IfError, data?: any[]) => void): void;
    setData(database: string, table: string, key: any, data: any, callback: (err?: IfError) => void): void;
    deleteData(database: string, table: string, key: any, callback: (err?: IfError) => void): void;
    deleteKeys(database: string, table: string, keys: any[], callback: (err?: IfError) => void): void;
}

export interface ToshihikoOptions {
    cache?: CacheOptions | CacheInstance;
    [key: string]: any;
}

export interface AdapterOptions {
    username?: string;
    password?: string;
    database?: string;
    host?: string;
    port?: number;
    showSql?: boolean | ((sql: string) => void);
    package?: string;
    [key: string]: any;
}

export interface FindOptions {
    single?: boolean;
    noCache?: boolean;
}

export interface QueryOptions {
    fields?: string[];
    where?: ObjStatic;
    order?: Array<ObjStatic>;
    limit?: number[];
    update?: ObjStatic;
    index?: string;
    conn?: any;
    single?: boolean;
    noCache?: boolean;
    count?: boolean;
}

export interface PromisifiedCallback extends Function {
    promise: Promise<any>;
    $promise?: Promise<any>;
}

export interface AdapterData {
    field: any;
    value: any;
}
