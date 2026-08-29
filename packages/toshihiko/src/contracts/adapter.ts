import type { Toshihiko, ToshihikoOptions } from '../toshihiko';
import type { DataRow, DataValue } from './common';

export declare const adapterExecuteSpec: unique symbol;

export type AdapterOperationResult = DataValue | void;

export interface AdapterExecuteSpec<
  Arguments extends readonly DataValue[],
  QueryArguments extends readonly DataValue[],
  Result extends AdapterOperationResult,
> {
  readonly arguments: Arguments;
  readonly queryArguments: QueryArguments;
  readonly result: Result;
}

export type DefaultAdapterExecuteSpec = AdapterExecuteSpec<
  DataValue[],
  DataValue[],
  AdapterOperationResult
>;

export interface AdapterFindOptions {
  readonly noCache: boolean;
  readonly single: boolean;
}

export interface AdapterQuery<
  Model = object,
  Connection = object,
  Cache = object | null,
  UpdateData extends object = DataRow,
  Where extends object = DataRow,
> {
  readonly cache: Cache;
  readonly connection: Connection | null;
  readonly fields: readonly string[];
  readonly index: string;
  readonly limit: readonly number[];
  readonly model: Model;
  readonly order: readonly Readonly<Record<string, number>>[];
  readonly updateData: UpdateData;
  readonly where: Where;
}

export type AdapterRow = DataRow;

export interface AdapterData<Field = object, Value = DataValue> {
  readonly field: Field;
  readonly value: Value;
}

export type AdapterFindResult =
  | AdapterRow
  | readonly AdapterRow[]
  | null;

export interface Adapter<
  Model = object,
  Connection = object,
  Field = object,
  Value = DataValue,
  Query extends AdapterQuery<Model, Connection> = AdapterQuery<Model, Connection>,
  ExecuteSpec extends AdapterExecuteSpec<
    readonly DataValue[],
    readonly DataValue[],
    AdapterOperationResult
  > = DefaultAdapterExecuteSpec,
> {
  readonly [adapterExecuteSpec]?: ExecuteSpec;
  readonly find: (
    query: Query,
    options?: AdapterFindOptions,
  ) => Promise<AdapterFindResult>;
  readonly count: (
    query: Query,
  ) => Promise<number>;
  readonly updateByQuery?: (
    query: Query,
  ) => Promise<AdapterOperationResult>;
  readonly insert: (
    model: Model,
    connection: Connection | null,
    data: readonly AdapterData<Field, Value>[],
  ) => Promise<AdapterRow | null>;
  readonly update: (
    model: Model,
    connection: Connection | null,
    primaryKey: DataRow,
    data: readonly AdapterData<Field, Value>[],
  ) => Promise<AdapterOperationResult>;
  readonly deleteByQuery: (
    query: Query,
  ) => Promise<AdapterOperationResult>;
  readonly execute?: (
    ...arguments_: ExecuteSpec['arguments']
  ) => Promise<ExecuteSpec['result']>;
  readonly beginTransaction?: () => Promise<Connection>;
  readonly commit?: (connection: Connection) => Promise<AdapterOperationResult>;
  readonly rollback?: (connection: Connection) => Promise<AdapterOperationResult>;
  getDBName(): string;
}

export interface AdapterLike {
  readonly find: (
    query: never,
    options?: AdapterFindOptions,
  ) => Promise<AdapterFindResult>;
  readonly count: (
    query: never,
  ) => Promise<number>;
  readonly insert: (
    model: never,
    connection: never,
    data: readonly never[],
  ) => Promise<AdapterRow | null>;
  readonly update: (
    model: never,
    connection: never,
    primaryKey: DataRow,
    data: readonly never[],
  ) => Promise<AdapterOperationResult>;
  readonly deleteByQuery: (
    query: never,
  ) => Promise<AdapterOperationResult>;
  getDBName(): string;
}

export type AdapterModel<Instance extends AdapterLike> =
  Parameters<Instance['insert']>[0];

export type AdapterConnection<Instance extends AdapterLike> =
  Exclude<Parameters<Instance['insert']>[1], null>;

export type AdapterField<Instance extends AdapterLike> =
  Parameters<Instance['insert']>[2][number] extends AdapterData<infer Field, infer _Value>
    ? Field
    : never;

export type AdapterValue<Instance extends AdapterLike> =
  Parameters<Instance['insert']>[2][number] extends AdapterData<infer _Field, infer Value>
    ? Value
    : never;

export type AdapterQueryType<Instance extends AdapterLike> =
  Parameters<Instance['find']>[0];

export type AdapterCountQueryType<Instance extends AdapterLike> =
  Parameters<Instance['count']>[0];

export type AdapterUpdateModel<Instance extends AdapterLike> =
  Parameters<Instance['update']>[0];

export type AdapterUpdateConnection<Instance extends AdapterLike> =
  Exclude<Parameters<Instance['update']>[1], null>;

export type AdapterUpdateField<Instance extends AdapterLike> =
  Parameters<Instance['update']>[3][number] extends AdapterData<infer Field, infer _Value>
    ? Field
    : never;

export type AdapterUpdateValue<Instance extends AdapterLike> =
  Parameters<Instance['update']>[3][number] extends AdapterData<infer _Field, infer Value>
    ? Value
    : never;

export type AdapterDeleteQueryType<Instance extends AdapterLike> =
  Parameters<Instance['deleteByQuery']>[0];

type AdapterMethodValue<
  Instance,
  Name extends PropertyKey,
> = Name extends keyof Instance ? Exclude<Instance[Name], undefined> : undefined;

type AdapterDeclaredExecuteSpec<Instance> =
  typeof adapterExecuteSpec extends keyof Instance
    ? Exclude<Instance[typeof adapterExecuteSpec], undefined>
    : undefined;

export type AdapterUpdateByQueryType<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'updateByQuery'> extends (
    query: infer Query,
  ) => DataValue ? Query : never;

export type AdapterUpdateByQueryResult<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'updateByQuery'> extends (
    query: infer _Query,
  ) => infer Result ? Awaited<Result> : never;

export type AdapterUpdateByQueryCallArguments<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'updateByQuery'> extends (
    query: infer _Query,
  ) => infer _Result
    ? readonly []
    : readonly [unsupportedAdapterUpdateByQuery: never];

export type AdapterDeleteByQueryResult<Instance extends AdapterLike> =
  Awaited<ReturnType<Instance['deleteByQuery']>>;

export type AdapterExecuteArguments<Instance extends AdapterLike> =
  AdapterDeclaredExecuteSpec<Instance> extends AdapterExecuteSpec<
    infer Arguments,
    infer _QueryArguments,
    infer _Result
  >
    ? Arguments
    : AdapterMethodValue<Instance, 'execute'> extends (
      ...arguments_: infer Arguments
    ) => infer _Result
      ? Arguments
      : readonly [unsupportedAdapterExecute: never];

type WithoutConnection<Arguments, Connection> =
  Arguments extends readonly [Connection | null, ...infer Rest]
    ? Rest
    : Arguments;

export type AdapterQueryExecuteArguments<Instance extends AdapterLike> =
  AdapterDeclaredExecuteSpec<Instance> extends AdapterExecuteSpec<
    infer _Arguments,
    infer QueryArguments,
    infer _Result
  >
    ? QueryArguments
    : AdapterMethodValue<Instance, 'execute'> extends (
      ...arguments_: infer Arguments
    ) => infer _Result
      ? WithoutConnection<Arguments, AdapterConnection<Instance>>
      : readonly [unsupportedAdapterExecute: never];

export type AdapterExecuteResult<Instance extends AdapterLike> =
  AdapterDeclaredExecuteSpec<Instance> extends AdapterExecuteSpec<
    infer _Arguments,
    infer _QueryArguments,
    infer Result
  >
    ? Result
    : AdapterMethodValue<Instance, 'execute'> extends (
      ...arguments_: infer _Arguments
    ) => infer Result
      ? Awaited<Result>
      : never;

export type AdapterTransactionConnection<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'beginTransaction'> extends () => infer Result
    ? Awaited<Result>
    : never;

export type AdapterBeginTransactionArguments<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'beginTransaction'> extends () => infer _Result
    ? readonly []
    : readonly [unsupportedAdapterTransaction: never];

export type AdapterCommitResult<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'commit'> extends (
    ...arguments_: infer _Arguments
  ) => infer Result
    ? Awaited<Result>
    : never;

export type AdapterCommitArguments<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'commit'> extends (
    ...arguments_: infer _Arguments
  ) => infer _Result
    ? readonly [connection: AdapterTransactionConnection<Instance>]
    : readonly [unsupportedAdapterCommit: never];

export type AdapterRollbackResult<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'rollback'> extends (
    ...arguments_: infer _Arguments
  ) => infer Result
    ? Awaited<Result>
    : never;

export type AdapterRollbackArguments<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'rollback'> extends (
    ...arguments_: infer _Arguments
  ) => infer _Result
    ? readonly [connection: AdapterTransactionConnection<Instance>]
    : readonly [unsupportedAdapterRollback: never];

export interface AdapterConstructor<
  Options extends object = ToshihikoOptions,
  Instance extends AdapterLike = Adapter,
> {
  new(parent: Toshihiko<Instance, Options>, options: Options): Instance;
}

export type AdapterSource<
  Options extends object = ToshihikoOptions,
  Instance extends AdapterLike = Adapter,
> = string | Instance | AdapterConstructor<Options, Instance>;
