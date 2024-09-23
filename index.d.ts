import { Connection } from 'mysql';

type ObjStatic = { [key: string]: any };
type IfError = Error | undefined;
type OnlyErrorCallback = (err?: IfError) => void;
type YukariDeleteCallback = (err: IfError, deleted?: boolean, sql?: string) => void;
type YukariInsertCallback = (err: IfError, record?: Yukari|null, sql?: string) => void;
type YukariUpdateCallback = (err: IfError, record?: Yukari|null, sql?: string) => void;

type ResultCallback = (err: IfError, result?: any, sql?: string) => void;
type FindCallback = (err: IfError, row?: Yukari|null|ObjStatic|(Yukari|ObjStatic)[], sql?: string) => void;
type FindOneCallback = (err: IfError, record?: Yukari|null|ObjStatic, sql?: string) => void;

export interface BaseType<T> {
  name: string;
  needQuotes?: boolean;
  defaultValue?: T;

  restore(parsed: T): any;
  parse(orig: any): T;

  equal?: (a: any, b: any) => boolean;
  toJSON?: (a: T) => any;
}

interface _Type {
  String: BaseType<string>;
  Boolean: BaseType<boolean>;
  Integer: BaseType<number>;
  Float: BaseType<number>;
  Json: BaseType<ObjStatic>;
  Datetime: BaseType<Date>;

  $equal: (a: any, b: any) => boolean;
}

export const Type: _Type;

export class Toshihiko {
  constructor(adapter: any, options: object);

  database: string;

  execute(sql: string, params?: any[]|ResultCallback, callback?: ResultCallback): Promise<any>;
  define(collectionName: string, schema: any[], options?: any): Model;
}

export class Yukari {
  constructor(model: Model, source: 'new'|'query'|'delete');
  [key: string]: any;

  fillRowFromSource(row: ObjStatic, rowInOrigName: boolean): void;
  buildNewRow(row: ObjStatic, rowInOrigName: boolean): void;
  fieldIndex(name: string): number;
  validateOne(name: string, value: any, callback: OnlyErrorCallback): void;
  validateAll(callback: OnlyErrorCallback): void;
  delete(conn?: undefined|Connection|YukariDeleteCallback, callback?: YukariDeleteCallback): Promise<boolean>;
  insert(conn?: undefined|Connection|YukariInsertCallback, callback?: YukariInsertCallback): Promise<Yukari|null>;
  update(conn?: undefined|Connection|YukariUpdateCallback, callback?: YukariUpdateCallback): Promise<Yukari|null>;
  save(conn?: undefined|Connection|YukariUpdateCallback|YukariInsertCallback, callback?: YukariUpdateCallback|YukariInsertCallback): Promise<Yukari|null>;
  toJSON(old?: boolean): ObjStatic;

  static extractAdapterData(model: Model, dataYnYukari: Yukari): ({ field: string, value: any })[];
}

export class Query {
  constructor(model: Model);

  index(idx: number): Query;
  where(condition: ObjStatic): Query;
  fields(fields: string|string[]): Query;
  limit(first: number|string|(number|string)[], second?: number|string): Query;
  order(order: string|ObjStatic|(string|ObjStatic)[]): Query;
  conn(conn: Connection): Query;

  count(callback?: (err: IfError, count?: number, sql?: string) => void): Promise<number>;
  find(callback?: FindCallback, toJSON?: boolean, options?: { single?: boolean, noCache?: boolean }): Promise<Yukari|null|ObjStatic|(Yukari|ObjStatic)[]>;
  findById(id: any|ObjStatic, callback?: FindOneCallback, toJSON?: boolean): Promise<Yukari|null|ObjStatic>;
  findOne(callback?: FindOneCallback, toJSON?: boolean): Promise<Yukari|null|ObjStatic>;
  update(data: ObjStatic, callback?: ResultCallback): Promise<any>;
  delete(data: ObjStatic, callback?: ResultCallback): Promise<any>;

  execute(sql: string, params?: any[]|ResultCallback, callback?: ResultCallback): Promise<any>;
}

export class Model {
  constructor(name: string, toshihiko: any, schema: any[], options?: object);
  [key: string]: any;
  toshihiko: any;

  beginTransaction(callback?: (err: IfError, conn?: Connection) => void): Promise<Connection>;
  commit(conn: Connection, callback?: OnlyErrorCallback): Promise<void>;
  rollback(conn: Connection, callback?: OnlyErrorCallback): Promise<void>;

  build(fields: ObjStatic): Yukari;
  where(condition: ObjStatic): Query;
  fields(fields: string|string[]): Query;
  limit(first: number|string|(number|string)[], second?: number|string): Query;
  index(idx: number): Query;
  order(order: string|ObjStatic|(string|ObjStatic)[]): Query;
  conn(conn: Connection): Query;

  count(callback?: (err: IfError, count?: number, sql?: string) => void): Promise<number>;
  find(callback?: FindCallback, toJSON?: boolean, options?: { single?: boolean, noCache?: boolean }): Promise<Yukari|null|ObjStatic|(Yukari|ObjStatic)[]>;
  findById(id: any|ObjStatic, callback?: FindOneCallback, toJSON?: boolean): Promise<Yukari|null|ObjStatic>;
  findOne(callback?: FindOneCallback, toJSON?: boolean): Promise<Yukari|null|ObjStatic>;
  update(data: ObjStatic, callback?: ResultCallback): Promise<any>;
  delete(data: ObjStatic, callback?: ResultCallback): Promise<any>;

  execute(sql: string, params?: any[]|ResultCallback, callback?: ResultCallback): Promise<any>;

  convertColumnToName(input: string|string[]|{ [key: string]: string }): string|string[]|{ [key: string]: string }|undefined;
  getPrimaryKeysName(): string|string[];
  getPrimaryKeysColumn(): string|string[];
}

