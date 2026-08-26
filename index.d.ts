import { EventEmitter2 } from 'eventemitter2';

export type ObjStatic = Record<string, any>;
export type IfError = Error | null | undefined;
export type OnlyErrorCallback = (err?: IfError) => void;
export type ResultCallback<T = any> = (err: IfError, result?: T, sql?: string) => void;

export interface Connection {
  query(...args: any[]): any;
  beginTransaction?(callback: OnlyErrorCallback): any;
  commit?(callback: OnlyErrorCallback): any;
  rollback?(callback: OnlyErrorCallback): any;
  release?(): void;
  [key: string]: any;
}

export interface BaseType<T, Restored = any, JSONValue = T> {
  name: string;
  needQuotes?: boolean;
  defaultValue?: T;
  restore(parsed: T): Restored;
  parse(orig: any): T;
  equal?: (a: T, b: T) => boolean;
  toJSON?: (value: T) => JSONValue;
}

export type SyncValidator<T = any> = (value: T) => string | void;
export type AsyncValidator<T = any> = (value: T, callback: OnlyErrorCallback) => void;
export type Validator<T = any> = SyncValidator<T> | AsyncValidator<T>;

export interface FieldDefinition<T = any> {
  name: string;
  column?: string;
  type?: BaseType<T>;
  validators?: Validator<T> | Validator<T>[];
  allowNull?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  defaultValue?: T;
  [key: string]: any;
}

export interface Field<T = any> {
  readonly name: string;
  readonly column: string;
  readonly type: BaseType<T>;
  readonly validators: Validator<T>[];
  readonly allowNull: boolean;
  readonly primaryKey: boolean;
  readonly autoIncrement: boolean;
  readonly default: T | undefined;
  readonly defaultValue: T | undefined;
  readonly needQuotes: boolean;
  restore(value: T): any;
  parse(value: any): T;
}

interface TypeCollection {
  String: BaseType<string>;
  Boolean: BaseType<boolean>;
  Integer: BaseType<number>;
  Float: BaseType<number>;
  Json: BaseType<ObjStatic>;
  Datetime: BaseType<Date>;
  $equal(a: any, b: any): boolean;
}

export const Type: TypeCollection;

export interface EscaperCollection {
  escape(value: string): string;
  escape<T>(value: T): T;
  escapeLike(value: string): string;
}

export const Escaper: EscaperCollection;

export type CacheKey = string | number | ObjStatic;
export type CacheCallback<T = any> = (err?: IfError, data?: T) => void;

export interface CacheAdapter<Row extends ObjStatic = ObjStatic> {
  getData(
    database: string,
    table: string,
    keys: CacheKey | CacheKey[],
    callback: CacheCallback<Row[]>
  ): void;
  setData(
    database: string,
    table: string,
    key: CacheKey,
    data: Row,
    callback: CacheCallback
  ): void;
  deleteData(
    database: string,
    table: string,
    key: CacheKey,
    callback: CacheCallback
  ): void;
  deleteKeys(
    database: string,
    table: string,
    keys: CacheKey[],
    callback: CacheCallback
  ): void;
}

export interface CacheConfiguration {
  name?: string;
  path?: string;
  module?: { create(...args: any[]): CacheAdapter };
  [key: string]: any;
}

export interface ToshihikoOptions extends ObjStatic {
  cache?: CacheAdapter | CacheConfiguration | null;
}

export interface ModelOptions extends ObjStatic {
  cache?: CacheAdapter | CacheConfiguration | null;
}

export interface FindOptions {
  single?: boolean;
  noCache?: boolean;
}

export type FindResult<Row extends ObjStatic = ObjStatic> =
  | Yukari<Row>
  | null
  | Row
  | Array<Yukari<Row> | Row>;

export type FindCallback<Row extends ObjStatic = ObjStatic> =
  (err: IfError, row?: FindResult<Row>, sql?: string) => void;

export type FindOneCallback<Row extends ObjStatic = ObjStatic> =
  (err: IfError, record?: Yukari<Row> | Row | null, sql?: string) => void;

export type YukariDeleteCallback = (err: IfError, deleted?: boolean, sql?: string) => void;
export type YukariInsertCallback<Row extends ObjStatic = ObjStatic> =
  (err: IfError, record?: Yukari<Row> | null, sql?: string) => void;
export type YukariUpdateCallback<Row extends ObjStatic = ObjStatic> = YukariInsertCallback<Row>;

export interface AdapterData {
  field: Field;
  value: any;
}

export interface Yukari<Row extends ObjStatic = ObjStatic> {
  [key: string]: any;
  fillRowFromSource(row: ObjStatic, rowInOrigName?: boolean): void;
  buildNewRow(row: ObjStatic, rowInOrigName?: boolean): void;
  fieldIndex(name: string): number;
  validateOne(name: string, value: any, callback: OnlyErrorCallback): void;
  validateAll(callback: OnlyErrorCallback): void;
  delete(conn?: Connection | YukariDeleteCallback, callback?: YukariDeleteCallback): Promise<boolean>;
  insert(
    conn?: Connection | YukariInsertCallback<Row>,
    callback?: YukariInsertCallback<Row>
  ): Promise<Yukari<Row> | null>;
  update(
    conn?: Connection | YukariUpdateCallback<Row>,
    callback?: YukariUpdateCallback<Row>
  ): Promise<Yukari<Row> | null>;
  save(
    conn?: Connection | YukariInsertCallback<Row> | YukariUpdateCallback<Row>,
    callback?: YukariInsertCallback<Row> | YukariUpdateCallback<Row>
  ): Promise<Yukari<Row> | null>;
  toJSON(old?: boolean): Row;
}

export interface Query<Row extends ObjStatic = ObjStatic> {
  readonly toshihiko: Toshihiko;
  readonly adapter: AdapterInstance;
  readonly model: Model<Row>;
  readonly cache: CacheAdapter<Row> | null;
  index(idx: string): Query<Row>;
  where(condition: ObjStatic): Query<Row>;
  field(fields: string | string[]): Query<Row>;
  fields(fields: string | string[]): Query<Row>;
  limit(first: number | string | Array<number | string>, second?: number | string): Query<Row>;
  order(order: string | ObjStatic | Array<string | ObjStatic>): Query<Row>;
  orderBy(order: string | ObjStatic | Array<string | ObjStatic>): Query<Row>;
  conn(conn: Connection | null): Query<Row>;
  count(callback?: (err: IfError, count?: number, sql?: string) => void): Promise<number>;
  find(callback?: FindCallback<Row>, toJSON?: boolean, options?: FindOptions): Promise<FindResult<Row>>;
  find(toJSON?: boolean, options?: FindOptions): Promise<FindResult<Row>>;
  findById(
    id: any | ObjStatic,
    callback?: FindOneCallback<Row>,
    toJSON?: boolean
  ): Promise<Yukari<Row> | Row | null>;
  findOne(callback?: FindOneCallback<Row>, toJSON?: boolean): Promise<Yukari<Row> | Row | null>;
  update(data: Partial<Row>, callback?: ResultCallback): Promise<any>;
  delete(callback?: ResultCallback): Promise<any>;
  execute(...args: any[]): Promise<any>;
}

export interface Model<Row extends ObjStatic = ObjStatic> extends EventEmitter2 {
  [key: string]: any;
  readonly name: string;
  readonly parent: Toshihiko;
  readonly toshihiko: Toshihiko;
  readonly originalSchema: FieldDefinition[];
  readonly schema: Field[];
  readonly primaryKeys: Field[];
  readonly cache: CacheAdapter<Row> | null;
  readonly nameToColumn: Record<string, string>;
  readonly columnToName: Record<string, string>;
  readonly fieldNamesMap: Record<string, Field>;
  readonly fieldColumnsMap: Record<string, Field>;
  ai: Field | null;
  beginTransaction(callback?: (err: IfError, conn?: Connection) => void): Promise<Connection>;
  commit(conn: Connection, callback?: OnlyErrorCallback): Promise<void>;
  rollback(conn: Connection, callback?: OnlyErrorCallback): Promise<void>;
  build(fields: Partial<Row>): Yukari<Row>;
  where(condition: ObjStatic): Query<Row>;
  field(fields: string | string[]): Query<Row>;
  fields(fields: string | string[]): Query<Row>;
  limit(first: number | string | Array<number | string>, second?: number | string): Query<Row>;
  index(idx: string): Query<Row>;
  order(order: string | ObjStatic | Array<string | ObjStatic>): Query<Row>;
  orderBy(order: string | ObjStatic | Array<string | ObjStatic>): Query<Row>;
  conn(conn: Connection | null): Query<Row>;
  count(callback?: (err: IfError, count?: number, sql?: string) => void): Promise<number>;
  find(callback?: FindCallback<Row>, toJSON?: boolean, options?: FindOptions): Promise<FindResult<Row>>;
  find(toJSON?: boolean, options?: FindOptions): Promise<FindResult<Row>>;
  findById(
    id: any | ObjStatic,
    callback?: FindOneCallback<Row>,
    toJSON?: boolean
  ): Promise<Yukari<Row> | Row | null>;
  findOne(callback?: FindOneCallback<Row>, toJSON?: boolean): Promise<Yukari<Row> | Row | null>;
  update(data: Partial<Row>, callback?: ResultCallback): Promise<any>;
  delete(callback?: ResultCallback): Promise<any>;
  execute(...args: any[]): Promise<any>;
  convertColumnToName(input: string): string | undefined;
  convertColumnToName(input: string[]): Array<string | undefined>;
  convertColumnToName(input: Record<string, any>): Record<string, any>;
  getPrimaryKeysName(): string | string[];
  getPrimaryKeysColumn(): string | string[];
}

export interface AdapterInstance extends EventEmitter2 {
  readonly parent: Toshihiko;
  options: ObjStatic;
  find(query: Query, callback: FindCallback, options?: FindOptions): void;
  count(query: Query, callback: ResultCallback<number>): void;
  updateByQuery(query: Query, callback: ResultCallback): void;
  deleteByQuery(query: Query, callback: ResultCallback): void;
  insert(model: Model, conn: Connection | null, data: AdapterData[], callback: ResultCallback): void;
  update(
    model: Model,
    conn: Connection | null,
    primaryKey: ObjStatic,
    data: AdapterData[],
    callback: ResultCallback
  ): void;
  execute(...args: any[]): void;
  getDBName(): string;
  beginTransaction(callback: (err: IfError, conn?: Connection) => void): void;
  commit(conn: Connection, callback: OnlyErrorCallback): void;
  rollback(conn: Connection, callback: OnlyErrorCallback): void;
}

export interface AdapterConstructor {
  new(parent: Toshihiko, options?: ToshihikoOptions): AdapterInstance;
}

declare class BaseAdapter extends EventEmitter2 implements AdapterInstance {
  constructor(parent: Toshihiko, options?: ToshihikoOptions);
  readonly parent: Toshihiko;
  options: ObjStatic;
  find(query: Query, callback: FindCallback, options?: FindOptions): void;
  count(query: Query, callback: ResultCallback<number>): void;
  updateByQuery(query: Query, callback: ResultCallback): void;
  deleteByQuery(query: Query, callback: ResultCallback): void;
  insert(model: Model, conn: Connection | null, data: AdapterData[], callback: ResultCallback): void;
  update(
    model: Model,
    conn: Connection | null,
    primaryKey: ObjStatic,
    data: AdapterData[],
    callback: ResultCallback
  ): void;
  execute(...args: any[]): void;
  getDBName(): string;
  beginTransaction(callback: (err: IfError, conn?: Connection) => void): void;
  commit(conn: Connection, callback: OnlyErrorCallback): void;
  rollback(conn: Connection, callback: OnlyErrorCallback): void;
}

declare class MySQLAdapter extends BaseAdapter {
  readonly database: string;
  readonly username: string;
  readonly package: string;
}

export const Adapter: {
  base: typeof BaseAdapter;
  mysql: typeof MySQLAdapter;
};

export class Toshihiko extends EventEmitter2 {
  constructor(adapter: string | AdapterConstructor, options?: ToshihikoOptions);
  readonly database: string;
  readonly adapter: AdapterInstance;
  readonly options: ToshihikoOptions;
  readonly cache?: CacheAdapter;
  execute(...args: any[]): Promise<any>;
  define<Row extends ObjStatic = ObjStatic>(
    collectionName: string,
    schema: FieldDefinition[],
    options?: ModelOptions
  ): Model<Row>;
  static createCache(param: CacheAdapter | CacheConfiguration): CacheAdapter | null;
}
