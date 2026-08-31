import type { Toshihiko, ToshihikoOptions } from '../toshihiko';
import type { DataRow, DataValue } from './common';

/**
 * Type-only marker used to carry an Adapter's execute specification.
 * @zh 仅用于类型、承载 Adapter execute 规格的标记。
 * @ja Adapter の execute 仕様を型として保持するためだけに使用するマーカーです。
 */
export declare const adapterExecuteSpec: unique symbol;

/**
 * Common result values accepted from Adapter write operations.
 * @zh Adapter 写操作接受的通用结果值。
 * @ja Adapter の書き込み操作が返せる共通の結果値です。
 */
export type AdapterOperationResult = DataValue | void;

/**
 * Declares the arguments and result propagated to Toshihiko and Query execute
 * methods by a custom Adapter.
 * @zh 声明自定义 Adapter 传递给 Toshihiko 和 Query execute 方法的参数与结果。
 * @ja カスタム Adapter から Toshihiko および Query の execute メソッドへ伝播する引数と結果を宣言します。
 */
export interface AdapterExecuteSpec<
  Arguments extends readonly DataValue[],
  QueryArguments extends readonly DataValue[],
  Result extends AdapterOperationResult,
> {
  /**
   * Arguments accepted by `Toshihiko.execute()`.
   * @zh 以下方法接受的参数：`Toshihiko.execute()`。
   * @ja `Toshihiko.execute()` が受け付ける引数です。
   */
  readonly arguments: Arguments;
  /**
   * Arguments accepted by `Query.execute()` after its connection is removed.
   * @zh 以下方法接受的参数：`Query.execute()`，并在移除连接后返回。
   * @ja 接続を取り除いた後に `Query.execute()` が受け付ける引数です。
   */
  readonly queryArguments: QueryArguments;
  /**
   * Resolved execution result.
   * @zh 解析后的执行结果。
   * @ja 解決後の実行結果です。
   */
  readonly result: Result;
}

/**
 * Fallback execute specification for untyped Adapter implementations.
 * @zh 无类型 Adapter 实现使用的后备 execute 规格。
 * @ja 型指定のない Adapter 実装で使用する既定の execute 仕様です。
 */
export type DefaultAdapterExecuteSpec = AdapterExecuteSpec<
  DataValue[],
  DataValue[],
  AdapterOperationResult
>;

/**
 * Normalized options passed from Query to an Adapter find operation.
 * @zh 从 Query 传给 Adapter find 操作的规范化选项。
 * @ja Query から Adapter の find 操作へ渡す正規化済みのオプションです。
 */
export interface AdapterFindOptions {
  /**
   * Whether the Adapter should bypass query-result caching.
   * @zh Adapter 是否应绕过查询结果缓存。
   * @ja Adapter がクエリ結果のキャッシュを使用しないかどうかです。
   */
  readonly noCache: boolean;
  /**
   * Whether the Adapter should return at most one row.
   * @zh Adapter 是否应最多返回一行。
   * @ja Adapter が返すデータ行を最大 1 行にするかどうかです。
   */
  readonly single: boolean;
}

/**
 * Complete normalized query state received by an Adapter.
 * @zh Adapter 接收的完整规范化 Query 状态。
 * @ja Adapter が受け取る、正規化済みの完全な Query 状態です。
 */
export interface AdapterQuery<
  Model = object,
  Connection = object,
  Cache = object | null,
  UpdateData extends object = DataRow,
  Where extends object = DataRow,
> {
  /**
   * Effective Model Cache, when configured.
   * @zh 实际生效的 Model Cache（如果已配置）。
   * @ja 設定されている場合に実際に使用される Model の Cache です。
   */
  readonly cache: Cache;
  /**
   * Transaction connection selected by `Query.conn()`.
   * @zh 以下方法选择的事务连接：`Query.conn()`。
   * @ja `Query.conn()` で選択されたトランザクション接続です。
   */
  readonly connection: Connection | null;
  /**
   * Selected logical fields or Adapter expressions.
   * @zh 选中的逻辑字段或 Adapter 表达式。
   * @ja 選択された論理フィールドまたは Adapter 式です。
   */
  readonly fields: readonly string[];
  /**
   * Adapter-specific index hint.
   * @zh Adapter 特有的索引提示。
   * @ja Adapter 固有のインデックスヒントです。
   */
  readonly index: string;
  /**
   * Empty, `[count]`, or `[offset, count]`.
   * @zh 空值、`[count]`，或 `[offset, count]`。
   * @ja 空、`[count]`、または `[offset, count]` です。
   */
  readonly limit: readonly number[];
  /**
   * Model which created the Query.
   * @zh 创建此 Query 的 Model。
   * @ja この Query を作成した Model です。
   */
  readonly model: Model;
  /**
   * Normalized sort expressions.
   * @zh 规范化后的排序表达式。
   * @ja 正規化済みのソート式です。
   */
  readonly order: readonly Readonly<Record<string, number>>[];
  /**
   * Logical values supplied to a bulk update.
   * @zh 传给批量更新的逻辑值。
   * @ja 一括更新へ渡す論理値です。
   */
  readonly updateData: UpdateData;
  /**
   * Logical query condition.
   * @zh 逻辑查询条件。
   * @ja 論理的なクエリ条件です。
   */
  readonly where: Where;
}

/**
 * One storage row returned by an Adapter.
 * @zh Adapter 返回的一行存储层数据。
 * @ja Adapter が返すストレージ上の 1 行です。
 */
export type AdapterRow = DataRow;

/**
 * One compiled Field and application value crossing the Adapter boundary.
 * @zh 跨越 Adapter 边界的一个编译后 Field 与应用层值。
 * @ja Adapter 境界を越えて渡される、1 個のコンパイル済み Field とアプリケーション値です。
 */
export interface AdapterData<Field = object, Value = DataValue> {
  /**
   * Compiled Field metadata.
   * @zh 编译后的 Field 元数据。
   * @ja コンパイル済み Field のメタデータです。
   */
  readonly field: Field;
  /**
   * Application value associated with the Field.
   * @zh 与 Field 关联的应用层值。
   * @ja Field に対応するアプリケーション値です。
   */
  readonly value: Value;
}

/**
 * Row shape returned by an Adapter find implementation.
 * @zh Adapter find 实现返回的数据行结构。
 * @ja Adapter の find 実装が返すデータ行の構造です。
 */
export type AdapterFindResult =
  | AdapterRow
  | readonly AdapterRow[]
  | null;

/**
 * Contract implemented by a Toshihiko database adapter.
 * @zh Toshihiko 数据库 Adapter 需要实现的契约。
 * @ja Toshihiko のデータベース Adapter が実装する契約です。
 * @category Extension API
 * @zh 扩展 API
 * @ja 拡張 API
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
  /**
   * Finds storage rows for a normalized Query.
   * @zh 为规范化后的 Query 查找存储层数据行。
   * @ja 正規化済み Query に対応するストレージ上のデータ行を検索します。
   */
  readonly find: (
    query: Query,
    options?: AdapterFindOptions,
  ) => Promise<AdapterFindResult>;
  /**
   * Counts storage rows for a normalized Query.
   * @zh 统计规范化后的 Query 对应的存储层数据行。
   * @ja 正規化済み Query に対応するストレージ上のデータ行を数えます。
   */
  readonly count: (
    query: Query,
  ) => Promise<number>;
  /**
   * Optionally performs a bulk update for a normalized Query.
   * @zh 可选地为规范化后的 Query 执行批量更新。
   * @ja 正規化済み Query に対する一括更新を、対応している場合に実行します。
   */
  readonly updateByQuery?: (
    query: Query,
  ) => Promise<AdapterOperationResult>;
  /**
   * Inserts one row and may return generated storage values.
   * @zh 插入一行数据，并可返回存储层生成的值。
   * @ja 1 行を insert し、ストレージ側で生成された値を返すことがあります。
   */
  readonly insert: (
    model: Model,
    connection: Connection | null,
    data: readonly AdapterData<Field, Value>[],
  ) => Promise<AdapterRow | null>;
  /**
   * Updates one row located by original primary-key values.
   * @zh 更新由原始主键值定位的一行数据。
   * @ja 元の主キー値で特定した 1 行を update します。
   */
  readonly update: (
    model: Model,
    connection: Connection | null,
    primaryKey: DataRow,
    data: readonly AdapterData<Field, Value>[],
  ) => Promise<AdapterOperationResult>;
  /**
   * Deletes rows for a normalized Query.
   * @zh 删除规范化后的 Query 对应的数据行。
   * @ja 正規化済み Query に対応するデータ行を delete します。
   */
  readonly deleteByQuery: (
    query: Query,
  ) => Promise<AdapterOperationResult>;
  /**
   * Optionally executes an Adapter-specific raw operation.
   * @zh 可选地执行 Adapter 特有的 raw 操作。
   * @ja Adapter 固有の生の操作を、対応している場合に実行します。
   */
  readonly execute?: (
    ...arguments_: ExecuteSpec['arguments']
  ) => Promise<ExecuteSpec['result']>;
  /**
   * Optionally begins an Adapter transaction.
   * @zh 可选地开始 Adapter 事务。
   * @ja Adapter のトランザクションを、対応している場合に開始します。
   */
  readonly beginTransaction?: () => Promise<Connection>;
  /**
   * Optionally commits an Adapter transaction.
   * @zh 可选地提交 Adapter 事务。
   * @ja Adapter のトランザクションを、対応している場合に commit します。
   */
  readonly commit?: (connection: Connection) => Promise<AdapterOperationResult>;
  /**
   * Optionally rolls back an Adapter transaction.
   * @zh 可选地回滚 Adapter 事务。
   * @ja Adapter のトランザクションを、対応している場合に rollback します。
   */
  readonly rollback?: (connection: Connection) => Promise<AdapterOperationResult>;
  /**
   * Returns the database namespace used for Cache keys and metadata.
   * @zh 返回 Cache key 和元数据使用的数据库命名空间。
   * @ja Cache キーとメタデータに使用するデータベース名前空間を返します。
   */
  getDBName(): string;
}

/**
 * Minimum structural contract required for Adapter type inference.
 * @zh Adapter 类型推断所需的最小结构契约。
 * @ja Adapter の型推論に必要な最小限の構造的契約です。
 */
export interface AdapterLike {
  /**
   * Finds storage rows for a normalized Query.
   * @zh 查找规范化 Query 对应的存储层数据行。
   * @ja 正規化済みの Query に対応するストレージ上のデータ行を検索します。
   */
  readonly find: (
    query: never,
    options?: AdapterFindOptions,
  ) => Promise<AdapterFindResult>;
  /**
   * Counts storage rows for a normalized Query.
   * @zh 统计规范化 Query 对应的存储层数据行。
   * @ja 正規化済みの Query に対応するストレージ上のデータ行数を数えます。
   */
  readonly count: (
    query: never,
  ) => Promise<number>;
  /**
   * Inserts one row and may return generated storage values.
   * @zh 插入一行数据，并可能返回生成的存储层值。
   * @ja 1 行を挿入し、生成されたストレージ値を返す場合があります。
   */
  readonly insert: (
    model: never,
    connection: never,
    data: readonly never[],
  ) => Promise<AdapterRow | null>;
  /**
   * Updates one located row.
   * @zh 更新已经定位的一行数据。
   * @ja 特定済みの 1 行を更新します。
   */
  readonly update: (
    model: never,
    connection: never,
    primaryKey: DataRow,
    data: readonly never[],
  ) => Promise<AdapterOperationResult>;
  /**
   * Deletes rows for a normalized Query.
   * @zh 删除规范化 Query 对应的数据行。
   * @ja 正規化済みの Query に対応するデータ行を削除します。
   */
  readonly deleteByQuery: (
    query: never,
  ) => Promise<AdapterOperationResult>;
  /**
   * Returns the database namespace.
   * @zh 返回数据库命名空间。
   * @ja データベースの名前空間を返します。
   */
  getDBName(): string;
}

/**
 * Extracts the Model type accepted by an Adapter instance.
 * @zh 提取 Adapter 实例接受的 Model 类型。
 * @ja Adapter インスタンスが受け付ける Model 型を抽出します。
 */
export type AdapterModel<Instance extends AdapterLike> =
  Parameters<Instance['insert']>[0];

/**
 * Extracts the non-null transaction connection accepted by an Adapter.
 * @zh 提取 Adapter 接受的非 null 事务连接。
 * @ja Adapter が受け付ける null ではないトランザクション接続を抽出します。
 */
export type AdapterConnection<Instance extends AdapterLike> =
  Exclude<Parameters<Instance['insert']>[1], null>;

/**
 * Extracts the compiled Field type accepted by an Adapter insert operation.
 * @zh 提取 Adapter insert 操作接受的编译后 Field 类型。
 * @ja Adapter の insert 操作が受け付ける、コンパイル済み Field の型を抽出します。
 */
export type AdapterField<Instance extends AdapterLike> =
  Parameters<Instance['insert']>[2][number] extends AdapterData<infer Field, infer _Value>
    ? Field
    : never;

/**
 * Extracts the application value accepted by an Adapter insert operation.
 * @zh 提取 Adapter insert 操作接受的应用层值。
 * @ja Adapter の insert 操作が受け付けるアプリケーション値を抽出します。
 */
export type AdapterValue<Instance extends AdapterLike> =
  Parameters<Instance['insert']>[2][number] extends AdapterData<infer _Field, infer Value>
    ? Value
    : never;

/**
 * Extracts the Query shape accepted by an Adapter find operation.
 * @zh 提取 Adapter find 操作接受的 Query 结构。
 * @ja Adapter の find 操作が受け付ける Query 構造を抽出します。
 */
export type AdapterQueryType<Instance extends AdapterLike> =
  Parameters<Instance['find']>[0];

/**
 * Extracts the Query shape accepted by an Adapter count operation.
 * @zh 提取 Adapter count 操作接受的 Query 结构。
 * @ja Adapter の count 操作が受け付ける Query 構造を抽出します。
 */
export type AdapterCountQueryType<Instance extends AdapterLike> =
  Parameters<Instance['count']>[0];

/**
 * Extracts the Model type accepted by an Adapter update operation.
 * @zh 提取 Adapter 更新操作接受的 Model 类型。
 * @ja Adapter の update 操作が受け付ける Model 型を抽出します。
 */
export type AdapterUpdateModel<Instance extends AdapterLike> =
  Parameters<Instance['update']>[0];

/**
 * Extracts the transaction connection accepted by Adapter update.
 * @zh 提取 Adapter 更新接受的事务连接。
 * @ja Adapter の update 操作が受け付けるトランザクション接続を抽出します。
 */
export type AdapterUpdateConnection<Instance extends AdapterLike> =
  Exclude<Parameters<Instance['update']>[1], null>;

/**
 * Extracts the compiled Field type accepted by Adapter update.
 * @zh 提取 Adapter 更新接受的编译后 Field 类型。
 * @ja Adapter の update 操作が受け付けるコンパイル済み Field 型を抽出します。
 */
export type AdapterUpdateField<Instance extends AdapterLike> =
  Parameters<Instance['update']>[3][number] extends AdapterData<infer Field, infer _Value>
    ? Field
    : never;

/**
 * Extracts the application value accepted by Adapter update.
 * @zh 提取 Adapter 更新接受的应用层值。
 * @ja Adapter の update 操作が受け付けるアプリケーション値を抽出します。
 */
export type AdapterUpdateValue<Instance extends AdapterLike> =
  Parameters<Instance['update']>[3][number] extends AdapterData<infer _Field, infer Value>
    ? Value
    : never;

/**
 * Extracts the Query shape accepted by Adapter bulk delete.
 * @zh 提取 Adapter 批量删除接受的 Query 结构。
 * @ja Adapter の一括 delete が受け付ける Query 構造を抽出します。
 */
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

/**
 * Extracts the Query shape accepted by optional Adapter bulk update.
 * @zh 提取可选 Adapter 批量更新接受的 Query 结构。
 * @ja 任意の Adapter 一括 update が受け付ける Query 構造を抽出します。
 */
export type AdapterUpdateByQueryType<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'updateByQuery'> extends (
    query: infer Query,
  ) => DataValue ? Query : never;

/**
 * Extracts the resolved result of optional Adapter bulk update.
 * @zh 提取可选 Adapter 批量更新解析后的结果。
 * @ja 任意の Adapter 一括 update の解決後の結果を抽出します。
 */
export type AdapterUpdateByQueryResult<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'updateByQuery'> extends (
    query: infer _Query,
  ) => infer Result ? Awaited<Result> : never;

/**
 * Disables Query bulk update when an Adapter does not declare support.
 * @zh Adapter 未声明支持时，禁用 Query 批量更新。
 * @ja Adapter が対応を宣言していない場合、Query の一括 update を無効にします。
 */
export type AdapterUpdateByQueryCallArguments<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'updateByQuery'> extends (
    query: infer _Query,
  ) => infer _Result
    ? readonly []
    : readonly [unsupportedAdapterUpdateByQuery: never];

/**
 * Extracts the resolved result of Adapter bulk delete.
 * @zh 提取 Adapter 批量删除解析后的结果。
 * @ja Adapter の一括 delete の解決後の結果を抽出します。
 */
export type AdapterDeleteByQueryResult<Instance extends AdapterLike> =
  Awaited<ReturnType<Instance['deleteByQuery']>>;

/**
 * Extracts arguments accepted by `Toshihiko.execute()`.
 * @zh 提取以下方法接受的参数：`Toshihiko.execute()`。
 * @ja `Toshihiko.execute()` が受け付ける引数を抽出します。
 */
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

/**
 * Extracts arguments accepted by `Query.execute()`.
 * @zh 提取以下方法接受的参数：`Query.execute()`。
 * @ja `Query.execute()` が受け付ける引数を抽出します。
 */
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

/**
 * Extracts the resolved value of Adapter raw execution.
 * @zh 提取 Adapter 原始执行解析后的值。
 * @ja Adapter の生の実行処理で解決される値を抽出します。
 */
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

/**
 * Extracts the connection returned by Adapter transaction start.
 * @zh 提取 Adapter 开始事务后返回的连接。
 * @ja Adapter がトランザクションを開始したときに返す接続を抽出します。
 */
export type AdapterTransactionConnection<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'beginTransaction'> extends () => infer Result
    ? Awaited<Result>
    : never;

/**
 * Disables transaction start when an Adapter does not declare support.
 * @zh Adapter 未声明支持时，禁用事务开始操作。
 * @ja Adapter が対応を宣言していない場合、トランザクションの開始を無効にします。
 */
export type AdapterBeginTransactionArguments<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'beginTransaction'> extends () => infer _Result
    ? readonly []
    : readonly [unsupportedAdapterTransaction: never];

/**
 * Extracts the resolved result of Adapter transaction commit.
 * @zh 提取 Adapter 事务提交解析后的结果。
 * @ja Adapter のトランザクション commit の解決後の結果を抽出します。
 */
export type AdapterCommitResult<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'commit'> extends (
    ...arguments_: infer _Arguments
  ) => infer Result
    ? Awaited<Result>
    : never;

/**
 * Disables commit when an Adapter does not declare support.
 * @zh Adapter 未声明支持时，禁用 commit。
 * @ja Adapter が対応を宣言していない場合、commit を無効にします。
 */
export type AdapterCommitArguments<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'commit'> extends (
    ...arguments_: infer _Arguments
  ) => infer _Result
    ? readonly [connection: AdapterTransactionConnection<Instance>]
    : readonly [unsupportedAdapterCommit: never];

/**
 * Extracts the resolved result of Adapter transaction rollback.
 * @zh 提取 Adapter 事务回滚解析后的结果。
 * @ja Adapter のトランザクション rollback の解決後の結果を抽出します。
 */
export type AdapterRollbackResult<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'rollback'> extends (
    ...arguments_: infer _Arguments
  ) => infer Result
    ? Awaited<Result>
    : never;

/**
 * Disables rollback when an Adapter does not declare support.
 * @zh Adapter 未声明支持时，禁用 rollback。
 * @ja Adapter が対応を宣言していない場合、rollback を無効にします。
 */
export type AdapterRollbackArguments<Instance extends AdapterLike> =
  AdapterMethodValue<Instance, 'rollback'> extends (
    ...arguments_: infer _Arguments
  ) => infer _Result
    ? readonly [connection: AdapterTransactionConnection<Instance>]
    : readonly [unsupportedAdapterRollback: never];

/**
 * Constructor shape accepted by the Toshihiko constructor.
 * @zh Toshihiko 构造函数接受的构造函数结构。
 * @ja Toshihiko のコンストラクターが受け付けるコンストラクター型です。
 */
export interface AdapterConstructor<
  Options extends object = ToshihikoOptions,
  Instance extends AdapterLike = Adapter,
> {
  new(parent: Toshihiko<Instance, Options>, options: Options): Instance;
}

/**
 * Adapter name, instance, or constructor accepted by Toshihiko.
 * @zh Toshihiko 接受的 Adapter 名称、实例或构造函数。
 * @ja Toshihiko が受け付ける Adapter の名前、インスタンス、またはコンストラクターです。
 */
export type AdapterSource<
  Options extends object = ToshihikoOptions,
  Instance extends AdapterLike = Adapter,
> = string | Instance | AdapterConstructor<Options, Instance>;
