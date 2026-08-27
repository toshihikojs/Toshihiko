import type { ToshihikoOptions } from '../toshihiko';

export interface AdapterFindOptions {
  readonly noCache: boolean;
  readonly single: boolean;
}

export interface AdapterQuery<Model = unknown, Connection = unknown> {
  readonly _conn: Connection | null;
  readonly _fields: readonly string[];
  readonly _index: string;
  readonly _limit: readonly number[];
  readonly _order: readonly Readonly<Record<string, 1 | -1>>[];
  readonly _where: Readonly<Record<string, unknown>>;
  readonly model: Model;
}

export type AdapterRow = Readonly<Record<string, unknown>>;

export interface AdapterData<Field = unknown, Value = unknown> {
  readonly field: Field;
  readonly value: Value;
}

export type AdapterFindResult =
  | AdapterRow
  | readonly AdapterRow[]
  | null;

export interface Adapter<
  Model = unknown,
  Connection = unknown,
  Field = unknown,
  Value = unknown,
  Query extends AdapterQuery<Model, Connection> = AdapterQuery<Model, Connection>,
> {
  readonly find: (
    query: Query,
    options?: AdapterFindOptions,
  ) => Promise<AdapterFindResult>;
  readonly insert: (
    model: Model,
    connection: Connection | null,
    data: readonly AdapterData<Field, Value>[],
  ) => Promise<AdapterRow | null>;
  getDBName(): string;
}

export interface AdapterLike {
  readonly find: (
    query: never,
    options?: AdapterFindOptions,
  ) => Promise<AdapterFindResult>;
  readonly insert: (
    model: never,
    connection: never,
    data: readonly never[],
  ) => Promise<AdapterRow | null>;
  getDBName(): string;
}

export type AdapterModel<Instance extends AdapterLike> =
  Parameters<Instance['insert']>[0];

export type AdapterConnection<Instance extends AdapterLike> =
  Exclude<Parameters<Instance['insert']>[1], null>;

export type AdapterField<Instance extends AdapterLike> =
  Parameters<Instance['insert']>[2][number] extends AdapterData<infer Field, unknown>
    ? Field
    : never;

export type AdapterValue<Instance extends AdapterLike> =
  Parameters<Instance['insert']>[2][number] extends AdapterData<unknown, infer Value>
    ? Value
    : never;

export type AdapterQueryType<Instance extends AdapterLike> =
  Parameters<Instance['find']>[0];

export interface AdapterConstructor<
  Options extends object = ToshihikoOptions,
  Instance extends AdapterLike = Adapter,
> {
  new(options: Options): Instance;
}

export type AdapterSource<
  Options extends object = ToshihikoOptions,
  Instance extends AdapterLike = Adapter,
> = string | Instance | AdapterConstructor<Options, Instance>;
