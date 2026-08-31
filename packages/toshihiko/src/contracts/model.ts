import { EventEmitter2 } from 'eventemitter2';
import type { FieldName } from './common';
import type { DataRow, DataValue } from './common';
import type {
  Adapter,
  AdapterBeginTransactionArguments,
  AdapterCommitArguments,
  AdapterCommitResult,
  AdapterConnection,
  AdapterDeleteByQueryResult,
  AdapterExecuteResult,
  AdapterLike,
  AdapterQueryExecuteArguments,
  AdapterRollbackArguments,
  AdapterRollbackResult,
  AdapterTransactionConnection,
  AdapterUpdateByQueryResult,
  AdapterUpdateByQueryCallArguments,
} from './adapter';
import {
  Yukari,
  type BuiltYukari,
  type QueriedYukari,
} from '../yukari';
import {
  Query,
  type FindByIdInput,
  type QueryFindManyOptions,
  type QueryFindOneOptions,
  type QueryFindOptions,
  type QueryJsonRow,
  type QueryOrder,
  type QueryWhere,
} from '../query';
import {
  Field,
  type SchemaFieldDefinition,
  type FieldTypeFromDefinition,
  type PrimaryKeyNames,
  type RowFromSchema,
  type SchemaDefinition,
  type ValidatedFieldDefinition,
} from './field';
import { getAdapterInstance, type Toshihiko } from '../toshihiko';
import {
  createCache,
  type Cache,
  type CacheSource,
} from './cache';

/**
 * Options shared by models created with {@link Toshihiko.define}.
 * @zh 由以下方法创建的 Model 共享的选项：{@link Toshihiko.define}。
 * @ja {@link Toshihiko.define} で作成される Model に共通するオプションです。
 * @category Application API
 * @zh 应用 API
 * @ja アプリケーション API
 */
export interface ModelOptions {
  /**
   * Model-specific Cache, `false`/`null` to disable, or omitted to inherit.
   * @zh Model 特有的 Cache：`false`/`null` 可显式禁用；省略则继承。
   * @ja Model 固有の Cache です。`false` または `null` で無効化し、省略すると親から継承します。
   */
  readonly cache?: CacheSource | false | null;
  readonly [key: string]: DataValue;
}

type ValidatedModelMethods<Methods extends object> = {
  readonly [Name in keyof Methods]: Methods[Name] extends (
    ...arguments_: never[]
  ) => void ? Methods[Name] : never;
};

/**
 * Options accepted while defining a model.
 * @zh 定义 Model 时接受的选项。
 * @ja Model を定義するときに受け付けるオプションです。
 * @category Application API
 * @zh 应用 API
 * @ja アプリケーション API
 */
export type ModelDefinitionOptions<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike,
  Methods extends object,
> = ModelOptions & {
  /**
   * Functions copied onto the returned Model with a contextually typed `this`.
   * @zh 复制到返回 Model 上的函数，其中 `this` 会按上下文推断类型。
   * @ja 返される Model へコピーする関数です。`this` の型は文脈から推論されます。
   */
  readonly methods?: Methods & ValidatedModelMethods<Methods> & ThisType<
    Model<Name, Schema, AdapterInstance> & Methods
  >;
};

type ColumnName<Definition extends SchemaFieldDefinition> =
  Definition extends { readonly column: infer Column extends string }
    ? Column extends '' ? Definition['name'] : Column
    : Definition['name'];

/**
 * Maps every schema entry to its runtime Field.
 * @zh 把每个 schema 条目映射为运行时 Field。
 * @ja すべての schema 項目を実行時の Field へ変換します。
 */
export type CompiledSchema<Schema extends SchemaDefinition> = {
  readonly [Index in keyof Schema]: Schema[Index] extends SchemaFieldDefinition
    ? Field<Schema[Index]>
    : never;
};

/**
 * Maps logical schema field names to storage column names.
 * @zh 把逻辑 schema 字段名映射为存储列名。
 * @ja schema 上の論理フィールド名をストレージ列名へ対応付けます。
 */
export type NameToColumnMap<Schema extends SchemaDefinition> = {
  readonly [Definition in Schema[number] as Definition['name']]: ColumnName<Definition>;
};

/**
 * Maps logical schema field names to compiled Fields.
 * @zh 把逻辑 schema 字段名映射为编译后 Field。
 * @ja schema 上の論理フィールド名をコンパイル済み Field へ対応付けます。
 */
export type FieldNamesMap<Schema extends SchemaDefinition> = {
  readonly [Definition in Schema[number] as Definition['name']]: Field<Definition>;
};

/**
 * Schema-restricted input accepted by {@link Model.build}.
 * @zh 以下方法接受、且受 schema 限制的输入：{@link Model.build}。
 * @ja {@link Model.build} が受け付ける、schema によって制限された入力です。
 */
export type BuildInput<Schema extends SchemaDefinition> = Partial<RowFromSchema<Schema>>;

type TypeDefaultedDefinition<Definition extends SchemaFieldDefinition> =
  FieldTypeFromDefinition<Definition> extends { readonly defaultValue: infer Value }
    ? undefined extends Value ? never : Definition
    : never;

type DefaultedDefinition<Definition extends SchemaFieldDefinition> =
  Definition extends { readonly defaultValue: infer Value }
    ? undefined extends Value ? TypeDefaultedDefinition<Definition> : Definition
    : TypeDefaultedDefinition<Definition>;

type DefaultedFieldNames<Schema extends SchemaDefinition> =
  DefaultedDefinition<Schema[number]>['name'];

type RequiredKeys<Input extends object> = {
  [Name in keyof Input]-?: {} extends Pick<Input, Name> ? never : Name;
}[keyof Input];

type KnownBuiltFieldNames<
  Schema extends SchemaDefinition,
  Input extends BuildInput<Schema>,
> = Extract<RequiredKeys<Input> | DefaultedFieldNames<Schema>, keyof RowFromSchema<Schema>>;

/**
 * Row shape returned by `build()`: supplied and defaulted fields are known,
 * while the remaining schema fields stay optional.
 * @zh 以下方法返回的数据行结构：`build()`：调用方提供的字段和带默认值的字段会被视为确定存在，其余 schema 字段保持可选。
 * @ja `build()` が返すデータ行の構造です。指定されたフィールドと既定値のあるフィールドは存在が保証され、残りの schema フィールドは任意のままです。
 */
export type BuiltRowFromSchema<
  Schema extends SchemaDefinition,
  Input extends BuildInput<Schema>,
> = Pick<RowFromSchema<Schema>, KnownBuiltFieldNames<Schema, Input>>
  & Partial<Omit<RowFromSchema<Schema>, KnownBuiltFieldNames<Schema, Input>>>;

type NoUnknownBuildFields<
  Schema extends SchemaDefinition,
  Input extends BuildInput<Schema>,
> = Input & Record<Exclude<keyof Input, keyof RowFromSchema<Schema>>, never>;

/**
 * The table-level API returned by {@link Toshihiko.define}.
 *
 * A Model compiles the supplied schema, creates Query builders, constructs
 * Yukari rows, and exposes schema-aware metadata. Query entry methods always
 * create a fresh Query instance.
 * @zh 以下方法返回的表级 API：{@link Toshihiko.define}。
 *
 * Model 会编译传入的 schema、创建 Query 构造器、构造 Yukari 数据行，并公开能够感知 schema 的元数据。每个查询入口都会创建一个新的 Query 实例。
 * @ja {@link Toshihiko.define} が返すテーブル単位の API です。
 *
 * Model は指定された schema をコンパイルし、Query builder と Yukari のデータ行を作成して、schema を認識するメタデータを公開します。Query の入口となるメソッドは常に新しい Query インスタンスを作成します。
 * @category Application API
 * @zh 应用 API
 * @ja アプリケーション API
 */
export class Model<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike = Adapter,
> extends EventEmitter2 {
  /**
   * Table or collection name passed to {@link Toshihiko.define}.
   * @zh 传入以下方法的表名或集合名：{@link Toshihiko.define}。
   * @ja {@link Toshihiko.define} に渡したテーブル名またはコレクション名です。
   */
  declare readonly name: Name;
  /**
   * Toshihiko instance which owns this Model.
   * @zh 拥有此 Model 的 Toshihiko 实例。
   * @ja この Model を所有する Toshihiko インスタンスです。
   */
  declare readonly parent: Toshihiko<AdapterInstance>;
  /**
   * Exact schema array passed to {@link Toshihiko.define}.
   * @zh 传入以下方法的原始 schema 数组：{@link Toshihiko.define}。
   * @ja {@link Toshihiko.define} に渡した元の schema 配列です。
   */
  declare readonly originalSchema: Schema;
  /**
   * Model options passed to {@link Toshihiko.define}.
   * @zh 传入以下方法的 Model 选项：{@link Toshihiko.define}。
   * @ja {@link Toshihiko.define} に渡した Model オプションです。
   */
  declare readonly options: ModelOptions;
  /**
   * Runtime Field objects compiled from {@link originalSchema}.
   * @zh 从以下数据编译得到的运行时 Field 对象：{@link originalSchema}。
   * @ja {@link originalSchema} からコンパイルした実行時の Field オブジェクトです。
   */
  declare readonly schema: CompiledSchema<Schema>;
  /**
   * Compiled fields marked with `primaryKey: true`.
   * @zh 带有以下标记的所有编译后字段：`primaryKey: true`。
   * @ja `primaryKey: true` が指定されたコンパイル済みフィールドです。
   */
  declare readonly primaryKeys: readonly Field<Schema[number]>[];
  /**
   * Compiled field marked with `autoIncrement: true`, when present.
   * @zh 带有以下标记的编译后字段：`autoIncrement: true`（如果存在）。
   * @ja 存在する場合、`autoIncrement: true` が指定されたコンパイル済みフィールドです。
   */
  declare readonly autoIncrementField: Field<Schema[number]> | null;
  /**
   * Compatibility alias for {@link autoIncrementField}.
   * @zh 兼容性别名：{@link autoIncrementField}。
   * @ja {@link autoIncrementField} の互換エイリアスです。
   */
  declare ai: Field<Schema[number]> | null;
  /**
   * Logical field name to storage column name.
   * @zh 逻辑字段名到存储列名的映射。
   * @ja 論理フィールド名からストレージ列名への対応です。
   */
  declare readonly nameToColumn: NameToColumnMap<Schema>;
  /**
   * Storage column name to logical field name.
   * @zh 存储列名到逻辑字段名的映射。
   * @ja ストレージ列名から論理フィールド名への対応です。
   */
  declare readonly columnToName: Readonly<Record<string, FieldName<RowFromSchema<Schema>>>>;
  /**
   * Logical field name to compiled Field.
   * @zh 逻辑字段名到编译后 Field 的映射。
   * @ja 論理フィールド名からコンパイル済み Field への対応です。
   */
  declare readonly fieldNamesMap: FieldNamesMap<Schema>;
  /**
   * Storage column name to compiled Field.
   * @zh 存储列名到编译后 Field 的映射。
   * @ja ストレージ列名からコンパイル済み Field への対応です。
   */
  declare readonly fieldColumnsMap: Readonly<Record<string, Field<Schema[number]>>>;
  /**
   * Cache selected by Model options or inherited from the parent Toshihiko.
   * @zh 由 Model 选项指定或从上级 Toshihiko 继承的 Cache。
   * @ja Model のオプションで選択された、または親の Toshihiko から継承した Cache です。
   */
  declare readonly cache: Cache | null;

  constructor(
    name: Name,
    parent: Toshihiko<AdapterInstance>,
    schema: Schema,
    options: ModelOptions = {},
  ) {
    super();
    const resolvedOptions = options || {};
    const compiled = schema.map((definition) => new Field(
      definition as Schema[number] & ValidatedFieldDefinition<Schema[number]>,
    )) as CompiledSchema<Schema>;
    const primaryKeys: Field<Schema[number]>[] = [];
    const nameToColumn: Record<string, string> = {};
    const columnToName: Record<string, FieldName<RowFromSchema<Schema>>> = {};
    const fieldNamesMap: Record<string, Field<Schema[number]>> = {};
    const fieldColumnsMap: Record<string, Field<Schema[number]>> = {};
    let autoIncrementField: Field<Schema[number]> | null = null;

    for (const field of compiled) {
      if (field.primaryKey) {
        primaryKeys.push(field);
      }
      if (field.autoIncrement) {
        autoIncrementField = field;
      }

      nameToColumn[field.name] = field.column;
      columnToName[field.column] = field.name as FieldName<RowFromSchema<Schema>>;
      fieldNamesMap[field.name] = field;
      fieldColumnsMap[field.column] = field;
    }

    const typedNameToColumn = nameToColumn as NameToColumnMap<Schema>;
    const typedFieldNamesMap = fieldNamesMap as unknown as FieldNamesMap<Schema>;
    const cache = resolvedOptions.cache
      ? createCache(resolvedOptions.cache)
      : resolvedOptions.cache === undefined && parent.cache
        ? parent.cache
        : null;

    Object.defineProperties(this, {
      ai: { enumerable: true, value: autoIncrementField, writable: true },
      autoIncrementField: { value: autoIncrementField },
      cache: { enumerable: true, value: cache },
      columnToName: { value: columnToName },
      fieldColumnsMap: { value: fieldColumnsMap },
      fieldNamesMap: { value: typedFieldNamesMap },
      name: { enumerable: true, value: name },
      nameToColumn: { value: typedNameToColumn },
      options: { value: resolvedOptions },
      originalSchema: { value: schema },
      parent: { value: parent },
      primaryKeys: { enumerable: true, value: primaryKeys },
      schema: { enumerable: true, value: compiled },
    });

    if (this.primaryKeys.length === 0) {
      this.emit('log', `!!! WARNING: YOU'D BETTER ADD PRIMARY KEY(S) IN MODEL ${this.name} !!!`);
    }
  }

  /**
   * Compatibility getter for {@link parent}.
   * @zh 兼容性 getter，返回 {@link parent}。
   * @ja {@link parent} を返す互換ゲッターです。
   */
  get toshihiko(): Toshihiko<AdapterInstance> {
    return this.parent;
  }

  /**
   * Begins a transaction through the selected Adapter.
   *
   * This method is callable only when the Adapter declares transaction support.
   * @zh 通过所选 Adapter 开始事务。
   *
   * 只有 Adapter 声明支持事务时才能调用此方法。
   * @ja 選択された Adapter を介してトランザクションを開始します。
   *
   * Adapter がトランザクション対応を宣言している場合だけ、このメソッドを呼び出せます。
   * @returns The Adapter-specific transaction connection.
   * @zh Adapter 特有的事务连接。
   * @ja Adapter 固有のトランザクション接続です。
   */
  beginTransaction(
    ...support: AdapterBeginTransactionArguments<AdapterInstance>
  ): Promise<AdapterTransactionConnection<AdapterInstance>> {
    void support;
    const adapter = getAdapterInstance(this.parent) as unknown as {
      beginTransaction(): Promise<AdapterTransactionConnection<AdapterInstance>>;
    };
    return adapter.beginTransaction();
  }

  /**
   * Commits an Adapter transaction connection.
   * @zh 提交一个 Adapter 事务连接。
   * @ja Adapter のトランザクション接続を commit します。
   * @param connection - Connection returned by {@link beginTransaction}.
   * @zh connection - 以下方法返回的连接：{@link beginTransaction}。
   * @ja connection - {@link beginTransaction} が返した接続です。
   * @returns The Adapter-defined commit result.
   * @zh 由 Adapter 定义的提交结果。
   * @ja Adapter が定義する commit の結果です。
   */
  commit(
    ...[connection]: AdapterCommitArguments<AdapterInstance>
  ): Promise<AdapterCommitResult<AdapterInstance>> {
    const adapter = getAdapterInstance(this.parent) as unknown as {
      commit(value: AdapterTransactionConnection<AdapterInstance>): Promise<AdapterCommitResult<AdapterInstance>>;
    };
    return adapter.commit(connection);
  }

  /**
   * Rolls back an Adapter transaction connection.
   * @zh 回滚一个 Adapter 事务连接。
   * @ja Adapter のトランザクション接続を rollback します。
   * @param connection - Connection returned by {@link beginTransaction}.
   * @zh connection - 以下方法返回的连接：{@link beginTransaction}。
   * @ja connection - {@link beginTransaction} が返した接続です。
   * @returns The Adapter-defined rollback result.
   * @zh 由 Adapter 定义的回滚结果。
   * @ja Adapter が定義する rollback の結果です。
   */
  rollback(
    ...[connection]: AdapterRollbackArguments<AdapterInstance>
  ): Promise<AdapterRollbackResult<AdapterInstance>> {
    const adapter = getAdapterInstance(this.parent) as unknown as {
      rollback(value: AdapterTransactionConnection<AdapterInstance>): Promise<AdapterRollbackResult<AdapterInstance>>;
    };
    return adapter.rollback(connection);
  }

  /**
   * Creates a new Yukari row without writing it.
   *
   * Input keys are restricted to schema fields. Supplied fields and fields with
   * defaults are known to exist on the returned type; other fields remain
   * optional until assigned or loaded.
   * @zh 创建一个尚未写入数据库的 Yukari 数据行。
   *
   * 输入键只能是 schema 字段。返回类型中，调用方提供的字段和带默认值的字段会被视为确定存在；其他字段在赋值或从数据库加载前保持可选。
   * @ja データベースへ書き込まずに、新しい Yukari のデータ行を作成します。
   *
   * 入力キーは schema のフィールドに制限されます。指定されたフィールドと既定値のあるフィールドは戻り値の型上で存在が保証されます。ほかのフィールドは、代入または読み込みが行われるまで optional のままです。
   * @param fields - Initial application values keyed by logical field name.
   * @zh fields - 以逻辑字段名为键的初始应用层数据。
   * @ja fields - 論理フィールド名をキーとする、アプリケーション上の初期値です。
   * @returns A newly built Yukari ready for {@link Yukari.insert} or
   * {@link Yukari.save}.
   * @zh 一个新建的 Yukari，可执行以下操作：{@link Yukari.insert}，或者
   * {@link Yukari.save}。
   * @ja {@link Yukari.insert} または {@link Yukari.save} を実行できる、新しく構築された Yukari です。
   * @example
   * ```ts
   * const user = User.build({ email: 'yukari@example.com' });
   * await user.save();
   * ```
   */
  build<const Input extends BuildInput<Schema>>(
    fields: NoUnknownBuildFields<Schema, Input>,
  ): BuiltYukari<Name, Schema, Input, AdapterInstance> {
    const yukari = new Yukari<Name, Schema, AdapterInstance>(this, 'new', fields);
    return yukari as BuiltYukari<Name, Schema, Input, AdapterInstance>;
  }

  /**
   * Creates a fresh Query and applies {@link Query.where}.
   * @zh 创建一个新的 Query，并应用 {@link Query.where}。
   * @ja 新しい Query を作成し、{@link Query.where} を適用します。
   */
  where(condition: QueryWhere<RowFromSchema<Schema>>): Query<Name, Schema, AdapterInstance> {
    return new Query(this).where(condition);
  }

  /**
   * Creates a fresh Query and applies the {@link Query.field} alias.
   * @zh 创建一个新的 Query，并应用 {@link Query.field} 别名。
   * @ja 新しい Query を作成し、{@link Query.field} エイリアスを適用します。
   */
  field(
    fields: string | readonly FieldName<RowFromSchema<Schema>>[],
  ): Query<Name, Schema, AdapterInstance> {
    return new Query(this).fields(fields);
  }

  /**
   * Creates a fresh Query and applies {@link Query.fields}.
   * @zh 创建一个新的 Query，并应用 {@link Query.fields}。
   * @ja 新しい Query を作成し、{@link Query.fields} を適用します。
   */
  fields(
    fields: string | readonly FieldName<RowFromSchema<Schema>>[],
  ): Query<Name, Schema, AdapterInstance> {
    return new Query(this).fields(fields);
  }

  /**
   * Creates a fresh Query and applies {@link Query.limit}.
   * @zh 创建一个新的 Query，并应用 {@link Query.limit}。
   * @ja 新しい Query を作成し、{@link Query.limit} を適用します。
   */
  limit(limit: number | string | readonly (number | string)[]): Query<Name, Schema, AdapterInstance>;
  limit(offset: number | string, count: number | string): Query<Name, Schema, AdapterInstance>;
  limit(
    first: number | string | readonly (number | string)[],
    second?: number | string,
  ): Query<Name, Schema, AdapterInstance> {
    const query = new Query(this);
    return arguments.length <= 1
      ? query.limit(first)
      : query.limit(normalizeModelLimit(first), second as number | string);
  }

  /**
   * Creates a fresh Query and applies {@link Query.index}.
   * @zh 创建一个新的 Query，并应用 {@link Query.index}。
   * @ja 新しい Query を作成し、{@link Query.index} を適用します。
   */
  index(indexName: string): Query<Name, Schema, AdapterInstance> {
    return new Query(this).index(indexName);
  }

  /**
   * Creates a fresh Query and applies {@link Query.order}.
   * @zh 创建一个新的 Query，并应用 {@link Query.order}。
   * @ja 新しい Query を作成し、{@link Query.order} を適用します。
   */
  order(order: QueryOrder<RowFromSchema<Schema>>): Query<Name, Schema, AdapterInstance> {
    return new Query(this).order(order);
  }

  /**
   * Creates a fresh Query and applies the {@link Query.orderBy} alias.
   * @zh 创建一个新的 Query，并应用 {@link Query.orderBy} 别名。
   * @ja 新しい Query を作成し、{@link Query.orderBy} エイリアスを適用します。
   */
  orderBy(order: QueryOrder<RowFromSchema<Schema>>): Query<Name, Schema, AdapterInstance> {
    return new Query(this).orderBy(order);
  }

  /**
   * Creates a fresh Query and applies {@link Query.conn}.
   * @zh 创建一个新的 Query，并应用 {@link Query.conn}。
   * @ja 新しい Query を作成し、{@link Query.conn} を適用します。
   */
  conn(connection: AdapterConnection<AdapterInstance> | null): Query<Name, Schema, AdapterInstance> {
    return new Query(this).conn(connection);
  }

  /**
   * Counts all rows through a fresh Query.
   * @zh 通过一个新的 Query 统计所有数据行。
   * @ja 新しい Query を介して、すべてのデータ行を数えます。
   */
  count(): Promise<number> {
    return new Query(this).count();
  }

  /**
   * Updates rows through a fresh Query with no condition.
   *
   * Use {@link where} first unless updating the entire table is intentional.
   * @zh 通过一个没有查询条件的新 Query 更新数据行。
   *
   * 请先调用 {@link where}，除非确实要更新整张表。
   * @ja 条件のない新しい Query を介してデータ行を更新します。
   *
   * テーブル全体を意図的に更新する場合を除き、先に {@link where} を呼び出してください。
   */
  update(
    data: Partial<RowFromSchema<Schema>>,
    ...support: AdapterUpdateByQueryCallArguments<AdapterInstance>
  ): Promise<AdapterUpdateByQueryResult<AdapterInstance>> {
    return new Query(this).update(data, ...support);
  }

  /**
   * Deletes rows through a fresh Query with no condition.
   *
   * Use {@link where} first unless deleting the entire table is intentional.
   * @zh 通过一个没有查询条件的新 Query 删除数据行。
   *
   * 请先调用 {@link where}，除非确实要删除整张表。
   * @ja 条件のない新しい Query を介してデータ行を削除します。
   *
   * テーブル全体を意図的に削除する場合を除き、先に {@link where} を呼び出してください。
   */
  delete(): Promise<AdapterDeleteByQueryResult<AdapterInstance>> {
    return new Query(this).delete();
  }

  /**
   * Executes an Adapter-specific raw operation through a fresh Query.
   * @zh 通过一个新的 Query 执行 Adapter 特有的原始操作。
   * @ja 新しい Query を介して Adapter 固有の生の操作を実行します。
   */
  execute(
    ...arguments_: AdapterQueryExecuteArguments<AdapterInstance>
  ): Promise<AdapterExecuteResult<AdapterInstance>> {
    return new Query(this).execute(...arguments_);
  }

  /**
   * Finds rows through a fresh Query.
   *
   * The overloads and serialization behavior match {@link Query.find}.
   * @zh 通过一个新的 Query 查找数据行。
   *
   * 其重载与序列化行为和 {@link Query.find}。
   * @ja 新しい Query を介してデータ行を検索します。
   *
   * overload とシリアライズの挙動は {@link Query.find} と同じです。
   */
  find(): Promise<readonly QueriedYukari<Name, Schema, AdapterInstance>[]>;
  find(
    options: QueryFindManyOptions,
  ): Promise<readonly QueriedYukari<Name, Schema, AdapterInstance>[]>;
  find(
    options: QueryFindOneOptions,
  ): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  find(
    toJSON: false,
    options?: QueryFindManyOptions,
  ): Promise<readonly QueriedYukari<Name, Schema, AdapterInstance>[]>;
  find(
    toJSON: false,
    options: QueryFindOneOptions,
  ): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  find(
    toJSON: true,
    options?: QueryFindManyOptions,
  ): Promise<readonly QueryJsonRow<Schema>[]>;
  find(
    toJSON: true,
    options: QueryFindOneOptions,
  ): Promise<QueryJsonRow<Schema> | null>;
  find(
    options: QueryFindManyOptions,
    toJSON: true,
  ): Promise<readonly QueryJsonRow<Schema>[]>;
  find(
    options: QueryFindOneOptions,
    toJSON: false,
  ): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  find(
    options: QueryFindOneOptions,
    toJSON: true,
  ): Promise<QueryJsonRow<Schema> | null>;
  find(
    toJSONOrOptions: boolean | QueryFindOptions = false,
    options?: boolean | QueryFindOptions,
  ): Promise<
    | readonly QueriedYukari<Name, Schema, AdapterInstance>[]
    | QueriedYukari<Name, Schema, AdapterInstance>
    | readonly QueryJsonRow<Schema>[]
    | QueryJsonRow<Schema>
    | null
  > {
    const query = new Query(this);
    const find = query.find as (
      first: boolean | QueryFindOptions,
      second?: boolean | QueryFindOptions,
    ) => Promise<
      | readonly QueriedYukari<Name, Schema, AdapterInstance>[]
      | QueriedYukari<Name, Schema, AdapterInstance>
      | readonly QueryJsonRow<Schema>[]
      | QueryJsonRow<Schema>
      | null
    >;
    return find.call(query, toJSONOrOptions, options);
  }

  /**
   * Finds at most one row through a fresh Query.
   * @zh 通过一个新的 Query 查找至多一行数据。
   * @ja 新しい Query を介して最大 1 行を検索します。
   */
  findOne(): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  findOne(toJSON: false): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  findOne(toJSON: true): Promise<QueryJsonRow<Schema> | null>;
  findOne(
    toJSON = false,
  ): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null> | Promise<QueryJsonRow<Schema> | null> {
    return toJSON ? new Query(this).findOne(true) : new Query(this).findOne(false);
  }

  /**
   * Finds one row by primary key through a fresh Query.
   * @zh 通过一个新的 Query 按主键查找一行数据。
   * @ja 新しい Query を介して、主キーで 1 行を検索します。
   * @param id - Single primary-key value or composite-key object.
   * @zh id - 单一主键值或复合主键对象。
   * @ja id - 1 個の主キー値、または複合主キーオブジェクトです。
   */
  findById(
    id: FindByIdInput<Schema>,
  ): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  findById(
    id: FindByIdInput<Schema>,
    toJSON: false,
  ): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  findById(
    id: FindByIdInput<Schema>,
    toJSON: true,
  ): Promise<QueryJsonRow<Schema> | null>;
  findById(
    id: FindByIdInput<Schema>,
    toJSON = false,
  ): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null> | Promise<QueryJsonRow<Schema> | null> {
    const query = new Query(this);
    return toJSON ? query.findById(id, true) : query.findById(id, false);
  }

  /**
   * Converts storage column names to logical schema field names.
   *
   * Unknown columns return `undefined` for string or array input and are omitted
   * from object input.
   * @zh 将存储列名转换为 schema 中的逻辑字段名。
   *
   * 未知列会返回 `undefined`；字符串或数组输入会得到该值，对象输入则会省略相应属性。
   * @ja ストレージ列名を schema 上の論理フィールド名へ変換します。
   *
   * 未知の列に対して、文字列または配列の入力では `undefined` を返し、オブジェクトの入力では該当するプロパティを省略します。
   * @param column - One storage column name. Overloads also accept an array of
   * column names or a row keyed by column name.
   * @zh column - 一个存储列名。其他重载也接受列名数组，或以列名为键的数据行。
   * @ja column - 1 個のストレージ列名です。オーバーロードでは、列名の配列または列名をキーとするデータ行も受け付けます。
   * @returns The corresponding logical name or converted structure.
   * @zh 对应的逻辑名称或转换后的结构。
   * @ja 対応する論理名、または変換後の構造です。
   */
  convertColumnToName(column: string): FieldName<RowFromSchema<Schema>> | undefined;
  convertColumnToName(columns: readonly string[]): readonly (FieldName<RowFromSchema<Schema>> | undefined)[];
  convertColumnToName(object: DataRow): DataRow;
  convertColumnToName(object: unknown): unknown {
    if (typeof object === 'string') return this.columnToName[object];
    if (Array.isArray(object)) return object.map((column) => this.columnToName[column]);
    if (object !== null && typeof object === 'object') {
      const result: Record<string, unknown> = {};
      for (const [column, value] of Object.entries(object)) {
        const name = this.columnToName[column];
        if (name !== undefined) result[name] = value;
      }
      return result;
    }
    return undefined;
  }

  /**
   * Returns logical primary-key names.
   * @zh 返回逻辑主键名。
   * @ja 論理主キー名を返します。
   * @returns One string for a single key, an array for composite keys, or an
   * empty array when the Model has no primary key.
   * @zh 单一主键返回一个字符串，复合主键返回数组；Model 没有主键时返回空数组。
   * @ja 単一主キーでは 1 個の文字列、複合主キーでは配列、Model に主キーがない場合は空の配列です。
   */
  getPrimaryKeysName(): string | readonly string[] {
    if (this.primaryKeys.length === 0) return [];
    if (this.primaryKeys.length === 1) return this.primaryKeys[0]!.name;
    return this.primaryKeys.map((field) => field.name);
  }

  /**
   * Returns storage column names for primary keys.
   * @zh 返回主键对应的存储列名。
   * @ja 主キーに対応するストレージ列名を返します。
   * @returns One string for a single key, an array for composite keys, or an
   * empty array when the Model has no primary key.
   * @zh 单一主键返回一个字符串，复合主键返回数组；Model 没有主键时返回空数组。
   * @ja 単一主キーでは 1 個の文字列、複合主キーでは配列、Model に主キーがない場合は空の配列です。
   */
  getPrimaryKeysColumn(): string | readonly string[] {
    if (this.primaryKeys.length === 0) return [];
    if (this.primaryKeys.length === 1) return this.primaryKeys[0]!.column;
    return this.primaryKeys.map((field) => field.column);
  }
}

function normalizeModelLimit(
  value: number | string | readonly (number | string)[],
): number | string {
  return isReadonlyArray(value) ? value[0] ?? 0 : value;
}

function isReadonlyArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

/**
 * Extracts the complete application row type from a Model.
 * @zh 从 Model 提取完整应用层数据行类型。
 * @ja Model からアプリケーションの完全なデータ行型を抽出します。
 */
export type InferModelRow<ModelType> = ModelType extends Model<
  string,
  infer Schema,
  infer _AdapterInstance extends AdapterLike
>
  ? RowFromSchema<Schema>
  : never;

/**
 * Extracts logical primary-key field names from a Model.
 * @zh 从 Model 提取逻辑主键字段名。
 * @ja Model から論理主キーフィールド名を抽出します。
 */
export type InferModelPrimaryKey<ModelType> = ModelType extends Model<
  string,
  infer Schema,
  infer _AdapterInstance extends AdapterLike
>
  ? PrimaryKeyNames<Schema>
  : never;
