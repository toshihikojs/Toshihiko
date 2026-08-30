import type { Toshihiko, ToshihikoOptions } from '../toshihiko';
import type { DataRow, DataValue } from './common';

/** Type-only marker used to carry an Adapter's execute specification. */
export declare const adapterExecuteSpec: unique symbol;

/** Common result values accepted from Adapter write operations. */
export type AdapterOperationResult = DataValue | void;

/**
 * Declares the arguments and result propagated to Toshihiko and Query execute
 * methods by a custom Adapter.
 */
export interface AdapterExecuteSpec<
  Arguments extends readonly DataValue[],
  QueryArguments extends readonly DataValue[],
  Result extends AdapterOperationResult,
> {
  /** Arguments accepted by `Toshihiko.execute()`. */
  readonly arguments: Arguments;
  /** Arguments accepted by `Query.execute()` after its connection is removed. */
  readonly queryArguments: QueryArguments;
  /** Resolved execution result. */
  readonly result: Result;
}

/** Fallback execute specification for untyped Adapter implementations. */
export type DefaultAdapterExecuteSpec = AdapterExecuteSpec<
  DataValue[],
  DataValue[],
  AdapterOperationResult
>;

/** Normalized options passed from Query to an Adapter find operation. */
export interface AdapterFindOptions {
  /** Whether the Adapter should bypass query-result caching. */
  readonly noCache: boolean;
  /** Whether the Adapter should return at most one row. */
  readonly single: boolean;
}

/** Complete normalized query state received by an Adapter. */
export interface AdapterQuery<
  Model = object,
  Connection = object,
  Cache = object | null,
  UpdateData extends object = DataRow,
  Where extends object = DataRow,
> {
  /** Effective Model Cache, when configured. */
  readonly cache: Cache;
  /** Transaction connection selected by `Query.conn()`. */
  readonly connection: Connection | null;
  /** Selected logical fields or Adapter expressions. */
  readonly fields: readonly string[];
  /** Adapter-specific index hint. */
  readonly index: string;
  /** Empty, `[count]`, or `[offset, count]`. */
  readonly limit: readonly number[];
  /** Model which created the Query. */
  readonly model: Model;
  /** Normalized sort expressions. */
  readonly order: readonly Readonly<Record<string, number>>[];
  /** Logical values supplied to a bulk update. */
  readonly updateData: UpdateData;
  /** Logical query condition. */
  readonly where: Where;
}

/** One storage row returned by an Adapter. */
export type AdapterRow = DataRow;

/** One compiled Field and application value crossing the Adapter boundary. */
export interface AdapterData<Field = object, Value = DataValue> {
  /** Compiled Field metadata. */
  readonly field: Field;
  /** Application value associated with the Field. */
  readonly value: Value;
}

/** Row shape returned by an Adapter find implementation. */
export type AdapterFindResult =
  | AdapterRow
  | readonly AdapterRow[]
  | null;

/**
 * Contract implemented by a Toshihiko database adapter.
 *
 * @category Extension API
 */
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
  /** @internal */
  readonly [adapterExecuteSpec]?: ExecuteSpec;
  /** Finds storage rows for a normalized Query. */
  readonly find: (
    query: Query,
    options?: AdapterFindOptions,
  ) => Promise<AdapterFindResult>;
  /** Counts storage rows for a normalized Query. */
  readonly count: (
    query: Query,
  ) => Promise<number>;
  /** Optionally performs a bulk update for a normalized Query. */
  readonly updateByQuery?: (
    query: Query,
  ) => Promise<AdapterOperationResult>;
  /** Inserts one row and may return generated storage values. */
  readonly insert: (
    model: Model,
    connection: Connection | null,
    data: readonly AdapterData<Field, Value>[],
  ) => Promise<AdapterRow | null>;
  /** Updates one row located by original primary-key values. */
  readonly update: (
    model: Model,
    connection: Connection | null,
    primaryKey: DataRow,
    data: readonly AdapterData<Field, Value>[],
  ) => Promise<AdapterOperationResult>;
  /** Deletes rows for a normalized Query. */
  readonly deleteByQuery: (
    query: Query,
  ) => Promise<AdapterOperationResult>;
  /** Optionally executes an Adapter-specific raw operation. */
  readonly execute?: (
    ...arguments_: ExecuteSpec['arguments']
  ) => Promise<ExecuteSpec['result']>;
  /** Optionally begins an Adapter transaction. */
  readonly beginTransaction?: () => Promise<Connection>;
  /** Optionally commits an Adapter transaction. */
  readonly commit?: (connection: Connection) => Promise<AdapterOperationResult>;
  /** Optionally rolls back an Adapter transaction. */
  readonly rollback?: (connection: Connection) => Promise<AdapterOperationResult>;
  /** Returns the database namespace used for Cache keys and metadata. */
  getDBName(): string;
}

/** Minimum structural contract required for Adapter type inference. */
export interface AdapterLike {
  /** Finds storage rows for a normalized Query. */
  readonly find: (
    query: never,
    options?: AdapterFindOptions,
  ) => Promise<AdapterFindResult>;
  /** Counts storage rows for a normalized Query. */
  readonly count: (
    query: never,
  ) => Promise<number>;
  /** Inserts one row and may return generated storage values. */
  readonly insert: (
    model: never,
    connection: never,
    data: readonly never[],
  ) => Promise<AdapterRow | null>;
  /** Updates one located row. */
  readonly update: (
    model: never,
    connection: never,
    primaryKey: DataRow,
    data: readonly never[],
  ) => Promise<AdapterOperationResult>;
  /** Deletes rows for a normalized Query. */
  readonly deleteByQuery: (
    query: never,
  ) => Promise<AdapterOperationResult>;
  /** Returns the database namespace. */
  getDBName(): string;
}

/** Extracts the Model type accepted by an Adapter instance. */
export type AdapterModel<Instance extends AdapterLike> =
  Parameters<Instance['insert']>[0];

/** Extracts the non-null transaction connection accepted by an Adapter. */
export type AdapterConnection<Instance extends AdapterLike> =
  Exclude<Parameters<Instance['insert']>[1], null>;

/** Extracts the compiled Field type accepted by an Adapter insert operation. */
export type AdapterField<Instance extends AdapterLike> =
  Parameters<Instance['insert']>[2][number] extends AdapterData<infer Field, infer _Value>
    ? Field
    : never;

/** Extracts the application value accepted by an Adapter insert operation. */
export type AdapterValue<Instance extends AdapterLike> =
  Parameters<Instance['insert']>[2][number] extends AdapterData<infer _Field, infer Value>
    ? Value
    : never;

/** Extracts the Query shape accepted by an Adapter find operation. */
export type AdapterQueryType<Instance extends AdapterLike> =
  Parameters<Instance['find']>[0];

/** Extracts the Query shape accepted by an Adapter count operation. */
export type AdapterCountQueryType<Instance extends AdapterLike> =
  Parameters<Instance['count']>[0];

/** Extracts the Model type accepted by an Adapter update operation. */
export type AdapterUpdateModel<Instance extends AdapterLike> =
  Parameters<Instance['update']>[0];

/** Extracts the transaction connection accepted by Adapter update. */
export type AdapterUpdateConnection<Instance extends AdapterLike> =
  Exclude<Parameters<Instance['update']>[1], null>;

/** Extracts the compiled Field type accepted by Adapter update. */
export type AdapterUpdateField<Instance extends AdapterLike> =
  Parameters<Instance['update']>[3][number] extends AdapterData<infer Field, infer _Value>
    ? Field
    : never;

/** Extracts the application value accepted by Adapter update. */
export type AdapterUpdateValue<Instance extends AdapterLike> =
  Parameters<Instance['update']>[3][number] extends AdapterData<infer _Field, infer Value>
    ? Value
    : never;

/** Extracts the Query shape accepted by Adapter bulk delete. */
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

/** Extracts the Query shape accepted by optional Adapter bulk update. */
export type AdapterUpdateByQueryType<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'updateByQuery'> extends (
    query: infer Query,
  ) => DataValue ? Query : never;

/** Extracts the resolved result of optional Adapter bulk update. */
export type AdapterUpdateByQueryResult<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'updateByQuery'> extends (
    query: infer _Query,
  ) => infer Result ? Awaited<Result> : never;

/** Disables Query bulk update when an Adapter does not declare support. */
export type AdapterUpdateByQueryCallArguments<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'updateByQuery'> extends (
    query: infer _Query,
  ) => infer _Result
    ? readonly []
    : readonly [unsupportedAdapterUpdateByQuery: never];

/** Extracts the resolved result of Adapter bulk delete. */
export type AdapterDeleteByQueryResult<Instance extends AdapterLike> =
  Awaited<ReturnType<Instance['deleteByQuery']>>;

/** Extracts arguments accepted by `Toshihiko.execute()`. */
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

/** Extracts arguments accepted by `Query.execute()`. */
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

/** Extracts the resolved value of Adapter raw execution. */
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

/** Extracts the connection returned by Adapter transaction start. */
export type AdapterTransactionConnection<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'beginTransaction'> extends () => infer Result
    ? Awaited<Result>
    : never;

/** Disables transaction start when an Adapter does not declare support. */
export type AdapterBeginTransactionArguments<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'beginTransaction'> extends () => infer _Result
    ? readonly []
    : readonly [unsupportedAdapterTransaction: never];

/** Extracts the resolved result of Adapter transaction commit. */
export type AdapterCommitResult<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'commit'> extends (
    ...arguments_: infer _Arguments
  ) => infer Result
    ? Awaited<Result>
    : never;

/** Disables commit when an Adapter does not declare support. */
export type AdapterCommitArguments<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'commit'> extends (
    ...arguments_: infer _Arguments
  ) => infer _Result
    ? readonly [connection: AdapterTransactionConnection<Instance>]
    : readonly [unsupportedAdapterCommit: never];

/** Extracts the resolved result of Adapter transaction rollback. */
export type AdapterRollbackResult<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'rollback'> extends (
    ...arguments_: infer _Arguments
  ) => infer Result
    ? Awaited<Result>
    : never;

/** Disables rollback when an Adapter does not declare support. */
export type AdapterRollbackArguments<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'rollback'> extends (
    ...arguments_: infer _Arguments
  ) => infer _Result
    ? readonly [connection: AdapterTransactionConnection<Instance>]
    : readonly [unsupportedAdapterRollback: never];

/** Constructor shape accepted by the Toshihiko constructor. */
export interface AdapterConstructor<
  Options extends object = ToshihikoOptions,
  Instance extends AdapterLike = Adapter,
> {
  new(parent: Toshihiko<Instance, Options>, options: Options): Instance;
}

/** Adapter name, instance, or constructor accepted by Toshihiko. */
export type AdapterSource<
  Options extends object = ToshihikoOptions,
  Instance extends AdapterLike = Adapter,
> = string | Instance | AdapterConstructor<Options, Instance>;
