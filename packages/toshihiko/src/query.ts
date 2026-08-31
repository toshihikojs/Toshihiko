import type {
  Adapter,
  AdapterConnection,
  AdapterCountQueryType,
  AdapterDeleteByQueryResult,
  AdapterDeleteQueryType,
  AdapterExecuteResult,
  AdapterFindOptions,
  AdapterFindResult,
  AdapterLike,
  AdapterQuery,
  AdapterQueryExecuteArguments,
  AdapterQueryType,
  AdapterRow,
  AdapterUpdateByQueryResult,
  AdapterUpdateByQueryCallArguments,
  AdapterUpdateByQueryType,
} from './contracts/adapter';
import type { DataRow, FieldName } from './contracts/common';
import type {
  JsonRowFromSchema,
  RowFromSchema,
  SchemaDefinition,
} from './contracts/field';
import type { Model } from './contracts/model';
import { Yukari, type QueriedYukari } from './yukari';
import type { Cache } from './contracts/cache';
import { getAdapterInstance } from './toshihiko';

/**
 * Sort direction accepted by {@link Query.order}.
 * @zh 以下方法接受的排序方向：{@link Query.order}。
 * @ja {@link Query.order} が受け付けるソート方向です。
 * @category Application API
 * @zh 应用 API
 * @ja アプリケーション API
 */
export type QueryOrderDirection = number | 'asc' | 'ASC' | 'desc' | 'DESC';

/**
 * Operators accepted for one field in a query condition.
 * @zh 查询条件中一个字段接受的操作符。
 * @ja クエリ条件の 1 フィールドに指定できる演算子です。
 * @category Application API
 * @zh 应用 API
 * @ja アプリケーション API
 */
export interface QueryFieldOperators<Value> {
  /**
   * Requires all supplied values or nested field conditions.
   * @zh 要求所有提供的值或嵌套字段条件都成立。
   * @ja 指定されたすべての値、またはネストしたフィールド条件が成立する必要があります。
   */
  readonly $and?: Value | readonly Value[];
  /**
   * Inclusive two-value range.
   * @zh 包含端点的双值范围。
   * @ja 両端の値を含む 2 値の範囲です。
   */
  readonly $between?: readonly [Value, Value];
  /**
   * Equality comparison.
   * @zh 相等比较。
   * @ja 等価比較です。
   */
  readonly $eq?: Value;
  /**
   * Greater-than comparison.
   * @zh 大于比较。
   * @ja 大なり比較です。
   */
  readonly $gt?: Value;
  /**
   * Greater-than-or-equal comparison.
   * @zh 大于或等于比较。
   * @ja 以上比較です。
   */
  readonly $gte?: Value;
  /**
   * Membership comparison.
   * @zh 成员关系比较。
   * @ja 集合に含まれるかどうかの比較です。
   */
  readonly $in?: readonly Value[];
  /**
   * Adapter-defined pattern comparison.
   * @zh 由 Adapter 定义的模式比较。
   * @ja Adapter が定義するパターン比較です。
   */
  readonly $like?: Value;
  /**
   * Less-than comparison.
   * @zh 小于比较。
   * @ja 小なり比較です。
   */
  readonly $lt?: Value;
  /**
   * Less-than-or-equal comparison.
   * @zh 小于或等于比较。
   * @ja 以下比較です。
   */
  readonly $lte?: Value;
  /**
   * Inequality comparison.
   * @zh 不等比较。
   * @ja 不等価比較です。
   */
  readonly $neq?: Value;
  /**
   * Requires any supplied value or nested field condition.
   * @zh 要求任意一个提供的值或嵌套字段条件成立。
   * @ja 指定された値、またはネストしたフィールド条件のいずれかが成立する必要があります。
   */
  readonly $or?: Value | readonly Value[];
  /**
   * Alias of `$lt`.
   * @zh 以下类型的别名：`$lt`。
   * @ja `$lt` のエイリアスです。
   */
  readonly '<'?: Value;
  /**
   * Alias of `$lte`.
   * @zh 以下类型的别名：`$lte`。
   * @ja `$lte` のエイリアスです。
   */
  readonly '<='?: Value;
  /**
   * Alias of `$eq`.
   * @zh 以下类型的别名：`$eq`。
   * @ja `$eq` のエイリアスです。
   */
  readonly '==='?: Value;
  /**
   * Alias of `$gt`.
   * @zh 以下类型的别名：`$gt`。
   * @ja `$gt` のエイリアスです。
   */
  readonly '>'?: Value;
  /**
   * Alias of `$gte`.
   * @zh 以下类型的别名：`$gte`。
   * @ja `$gte` のエイリアスです。
   */
  readonly '>='?: Value;
  /**
   * Alias of `$neq`.
   * @zh 以下类型的别名：`$neq`。
   * @ja `$neq` のエイリアスです。
   */
  readonly '!=='?: Value;
}

/**
 * A direct value or an operator object for one field.
 * @zh 一个字段的直接值或操作符对象。
 * @ja 1 フィールドに対する直接の値、または演算子オブジェクトです。
 * @category Application API
 * @zh 应用 API
 * @ja アプリケーション API
 */
export type QueryFieldCondition<Value> = Value | QueryFieldOperators<Value>;

/**
 * A typed query condition for a model row.
 * @zh 针对 Model 数据行的类型化查询条件。
 * @ja Model のデータ行に対する型付きのクエリ条件です。
 * @category Application API
 * @zh 应用 API
 * @ja アプリケーション API
 */
export type QueryWhere<Row extends object> = {
  readonly [Name in keyof Row]?: QueryFieldCondition<Row[Name]>;
} & {
  readonly $and?: QueryWhere<Row> | readonly QueryWhere<Row>[];
  readonly $or?: QueryWhere<Row> | readonly QueryWhere<Row>[];
};

/**
 * Sort expressions accepted by {@link Query.order}.
 * @zh 以下方法接受的排序表达式：{@link Query.order}。
 * @ja {@link Query.order} が受け付けるソート式です。
 * @category Application API
 * @zh 应用 API
 * @ja アプリケーション API
 */
export type QueryOrder<Row extends object> =
  | string
  | Readonly<Partial<Record<FieldName<Row>, QueryOrderDirection>>>
  | readonly (
    | string
    | Readonly<Partial<Record<FieldName<Row>, QueryOrderDirection>>>
  )[];

/**
 * Options shared by query find operations.
 * @zh Query find 操作共享的选项。
 * @ja Query の find 操作に共通するオプションです。
 * @category Application API
 * @zh 应用 API
 * @ja アプリケーション API
 */
export interface QueryFindOptions {
  /**
   * Tell the Adapter to bypass query-result caching.
   * @zh 通知 Adapter 绕过查询结果缓存。
   * @ja クエリ結果のキャッシュを使用しないよう Adapter に指示します。
   */
  readonly noCache?: boolean;
  /**
   * Ask the Adapter for at most one result.
   * @zh 要求 Adapter 最多返回一个结果。
   * @ja Adapter が返す結果を最大 1 件にします。
   */
  readonly single?: boolean;
}

/**
 * Options which request multiple rows.
 * @zh 请求返回多行的选项。
 * @ja 複数行を要求するオプションです。
 * @category Application API
 * @zh 应用 API
 * @ja アプリケーション API
 */
export interface QueryFindManyOptions extends QueryFindOptions {
  readonly single?: false;
}

/**
 * Options which request one row.
 * @zh 请求返回一行的选项。
 * @ja 1 行を要求するオプションです。
 * @category Application API
 * @zh 应用 API
 * @ja アプリケーション API
 */
export interface QueryFindOneOptions extends QueryFindOptions {
  readonly single: true;
}

/**
 * Serialized partial row returned by a field-selecting Query.
 * @zh 选择字段的 Query 返回的部分序列化数据行。
 * @ja フィールドを選択する Query が返す、部分的にシリアライズされたデータ行です。
 */
export type QueryJsonRow<Schema extends SchemaDefinition> = Partial<
  JsonRowFromSchema<Schema>
>;

type PrimaryKeyName<Schema extends SchemaDefinition> = Extract<
  Schema[number],
  { readonly primaryKey: true }
>['name'];

/**
 * Primary-key value or object accepted by {@link Query.findById}.
 * @zh 以下方法接受的主键值或对象：{@link Query.findById}。
 * @ja {@link Query.findById} が受け付ける主キー値またはオブジェクトです。
 */
export type FindByIdInput<Schema extends SchemaDefinition> =
  [PrimaryKeyName<Schema>] extends [never]
    ? DataRow
    : RowFromSchema<Schema>[PrimaryKeyName<Schema>]
      | DataRow;

/**
 * Schema-aware normalized Query passed to an Adapter implementation.
 * @zh 传给 Adapter 实现、能感知 schema 的规范化 Query。
 * @ja Adapter 実装へ渡す、schema を反映した正規化済み Query です。
 */
export interface QueryAdapterData<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike,
> extends AdapterQuery<
  Model<Name, Schema, AdapterInstance>,
  AdapterConnection<AdapterInstance>,
  Cache | null,
  Partial<RowFromSchema<Schema>>,
  QueryWhere<RowFromSchema<Schema>>
> {
  readonly updateData: Partial<RowFromSchema<Schema>>;
  readonly where: QueryWhere<RowFromSchema<Schema>>;
}

/**
 * A mutable, chainable description of one database operation.
 *
 * Builder methods replace or extend the current Query state and return this
 * same instance. Start again from the Model when two independent operations
 * need different conditions, fields, limits, or connections.
 * @zh 对一次数据库操作的可变、可链式描述。
 *
 * 构造方法会替换或扩展当前 Query 状态，并返回同一个实例。如果两次独立操作需要不同的条件、字段、limit 或连接，请重新从 Model 开始。
 * @ja 1 回のデータベース操作を表す、変更可能でチェーン可能な記述です。
 *
 * builder メソッドは現在の Query 状態を置換または拡張し、同じインスタンスを返します。独立した 2 回の操作で条件、フィールド、limit、接続が異なる場合は、Model から新しく始めてください。
 * @category Application API
 * @zh 应用 API
 * @ja アプリケーション API
 */
export class Query<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike = Adapter,
> {
  readonly #adapter: AdapterInstance;
  readonly #cache: Cache | null;
  #connection: AdapterConnection<AdapterInstance> | null = null;
  #fields: string[];
  #index = '';
  #limit: number[] = [];
  readonly #model: Model<Name, Schema, AdapterInstance>;
  #order: Readonly<Record<string, number>>[] = [];
  readonly #toshihiko: Model<Name, Schema, AdapterInstance>['parent'];
  #updateData: Partial<RowFromSchema<Schema>> = {};
  #where: QueryWhere<RowFromSchema<Schema>> = {};

  /**
   * Creates an empty Query selecting every field from the supplied Model.
   * @zh 创建一个选择所给 Model 全部字段的空 Query。
   * @ja 指定された Model の全フィールドを選択する空の Query を作成します。
   */
  constructor(model: Model<Name, Schema, AdapterInstance>) {
    this.#adapter = getAdapterInstance(model.parent);
    this.#cache = model.cache;
    this.#model = model;
    this.#toshihiko = model.parent;
    Object.defineProperties(this, {
      field: { value: this.fields, writable: true },
      orderBy: { value: this.order, writable: true },
    });
    this.#fields = model.schema.map((field) => field.name);
  }

  /**
   * Sets an Adapter-specific index hint.
   * @zh 设置 Adapter 特有的索引提示。
   * @ja Adapter 固有のインデックスヒントを設定します。
   * @param indexName - Index name passed to the Adapter without interpretation.
   * @zh indexName - 不作解释、直接传给 Adapter 的索引名。
   * @ja indexName - 解釈せずに Adapter へ渡すインデックス名です。
   * @returns This Query.
   * @zh 当前 Query。
   * @ja 現在の Query です。
   */
  index(indexName: string): this {
    this.#index = indexName;
    return this;
  }

  /**
   * Replaces the current query condition.
   *
   * A later call does not merge with an earlier condition. Use `$and` or `$or`
   * inside one condition when multiple branches are required.
   * @zh 替换当前查询条件。
   *
   * 后续调用不会与先前条件合并。需要组合条件时请使用 `$and` 或 `$or`
   * ，用于一个条件需要多个分支时。
   * @ja 現在のクエリ条件を置き換えます。
   *
   * 後の呼び出しは以前の条件とマージされません。1 個の条件に複数の分岐が必要な場合は、その条件内で `$and` または `$or` を使用してください。
   * @param condition - Field-aware condition object.
   * @zh condition - 能够感知 Field 的条件对象。
   * @ja condition - Field を認識する条件オブジェクトです。
   * @returns This Query.
   * @zh 当前 Query。
   * @ja 現在の Query です。
   * @throws When the runtime value is not an object.
   * @zh 运行时值不是对象时。
   * @ja 実行時の値がオブジェクトではない場合です。
   */
  where(condition: QueryWhere<RowFromSchema<Schema>>): this {
    if (typeof condition !== 'object') {
      throw new Error(`query condition expected to be an object but got ${typeof condition} ${String(condition)}.`);
    }

    this.#where = condition;
    return this;
  }

  /**
   * Compatibility alias of {@link fields}.
   * @zh 以下类型的兼容性别名：{@link fields}。
   * @ja {@link fields} の互換エイリアスです。
   */
  declare field: (fields: string | readonly FieldName<RowFromSchema<Schema>>[]) => this;

  /**
   * Replaces the selected fields.
   *
   * A string is split on commas and trimmed. An array receives schema field-name
   * checking, while strings remain available for Adapter-compatible expressions.
   * @zh 替换选中的字段。
   *
   * 字符串会按逗号拆分并去除空白；数组会检查 schema 字段名，而字符串仍可用于 Adapter 兼容表达式。
   * @ja 選択するフィールドを置き換えます。
   *
   * 文字列はカンマで分割され、前後の空白が除去されます。配列では schema のフィールド名を検査します。文字列は Adapter 互換の式にも使用できます。
   * @param fields - Comma-separated expression or logical field names.
   * @zh fields - 逗号分隔的表达式或逻辑字段名。
   * @ja fields - カンマ区切りの式、または論理フィールド名です。
   * @returns This Query.
   * @zh 当前 Query。
   * @ja 現在の Query です。
   * @throws When the runtime value is neither a string nor an array.
   * @zh 运行时值既不是字符串也不是数组时。
   * @ja 実行時の値が文字列でも配列でもない場合です。
   */
  fields(fields: string | readonly FieldName<RowFromSchema<Schema>>[]): this {
    let normalized: readonly unknown[] | unknown = fields;
    if (typeof fields === 'string') {
      normalized = fields.split(',').map((field) => field.trim()).filter(Boolean);
    }
    if (!isReadonlyArray(normalized)) {
      throw new Error(`query fields expected to be an array or string but got ${typeof fields} ${String(fields)}.`);
    }

    this.#fields = normalized as string[];
    return this;
  }

  /**
   * Sets the result count, or the offset and result count.
   *
   * Strings and arrays are retained for v1 compatibility. Values are parsed as
   * base-10 integers, invalid values become `0`, and at most two array entries
   * are used.
   * @zh 设置结果数量，或设置 offset 与结果数量。
   *
   * 为兼容 v1 会保留字符串和数组。值按十进制整数解析；无效值会变为 `0`；数组最多使用前两个元素。
   * @ja 結果数、または offset と結果数を設定します。
   *
   * v1 との互換性のため、文字列と配列も受け付けます。値は 10 進整数として parse され、無効な値は `0` になります。配列では最大 2 項目を使用します。
   * @param limit - Count, comma-separated values, or `[offset, count]`.
   * @zh limit - 数量、逗号分隔值或 `[offset, count]`。
   * @ja limit - 件数、カンマ区切りの値、または `[offset, count]` です。
   * @returns This Query.
   * @zh 当前 Query。
   * @ja 現在の Query です。
   */
  limit(limit: number | string | readonly (number | string)[]): this;
  limit(offset: number | string, count: number | string): this;
  limit(
    first: number | string | readonly (number | string)[],
    second?: number | string,
  ): this {
    if (arguments.length >= 2) {
      this.#limit = [normalizeLimit(first), normalizeLimit(second ?? 0)];
      return this;
    }

    if (typeof first === 'number') {
      this.#limit = [first];
      return this;
    }

    const values = typeof first === 'string'
      ? first.trim() === '' ? [] : first.split(',')
      : first;
    if (!isReadonlyArray(values)) {
      throw new Error(
        `query limit expected to be an array, number or string but got ${typeof first} ${String(first)}.`,
      );
    }
    this.#limit = values.slice(0, 2).map(normalizeLimit);
    return this;
  }

  /**
   * Replaces the current sort order.
   *
   * Object forms provide schema field-name checking. String forms are parsed as
   * comma-separated Adapter-compatible order expressions.
   * @zh 替换当前排序顺序。
   *
   * 对象形式会检查 schema 字段名；字符串形式会按逗号拆分并解析为 Adapter 兼容的排序表达式。
   * @ja 現在のソート順を置き換えます。
   *
   * オブジェクト形式では schema のフィールド名を検査します。文字列形式はカンマ区切りの Adapter 互換 order 式として parse されます。
   * @param order - String, field-direction object, or an array of either form.
   * @zh order - 字符串、字段方向对象，或任一形式组成的数组。
   * @ja order - 文字列、フィールドと方向のオブジェクト、またはいずれかの形式の配列です。
   * @returns This Query.
   * @zh 当前 Query。
   * @ja 現在の Query です。
   */
  order(order: QueryOrder<RowFromSchema<Schema>>): this {
    this.#order = normalizeOrder(order);
    return this;
  }

  /**
   * Compatibility alias of {@link order}.
   * @zh 以下类型的兼容性别名：{@link order}。
   * @ja {@link order} の互換エイリアスです。
   */
  declare orderBy: (order: QueryOrder<RowFromSchema<Schema>>) => this;

  /**
   * Selects the transaction connection used by subsequent execution.
   * @zh 选择后续执行使用的事务连接。
   * @ja 以降の実行で使用するトランザクション接続を選択します。
   * @param connection - Adapter-specific connection, or `null` to use the
   * Adapter's default connection behavior.
   * @zh connection - Adapter 特有的连接，或 `null` 时会使用 Adapter 的默认连接行为。
   * @ja connection - Adapter 固有の接続です。`null` の場合は Adapter の既定の接続方法を使用します。
   * @returns This Query.
   * @zh 当前 Query。
   * @ja 現在の Query です。
   */
  conn(connection: AdapterConnection<AdapterInstance> | null): this {
    this.#connection = connection;
    return this;
  }

  /**
   * Counts rows matching the current condition.
   * @zh 统计符合当前条件的数据行。
   * @ja 現在の条件に一致するデータ行数を数えます。
   * @returns The count reported by the Adapter.
   * @zh Adapter 报告的数量。
   * @ja Adapter が報告した件数です。
   */
  async count(): Promise<number> {
    return await this.#adapter.count(
      this.#adapterData() as AdapterCountQueryType<AdapterInstance>,
    );
  }

  /**
   * Updates rows matching the current condition.
   *
   * Availability, additional arguments, and the resolved value are determined
   * by the selected Adapter.
   * @zh 更新符合当前条件的数据行。
   *
   * 可用性、额外参数和 Promise 结果由所选 Adapter 决定。
   * @ja 現在の条件に一致するデータ行を更新します。
   *
   * 使用可否、追加の引数、解決後の値は、選択された Adapter によって決まります。
   * @param data - Logical field values to write.
   * @zh data - 要写入的逻辑字段值。
   * @ja data - 書き込む論理フィールドの値です。
   * @param support - Adapter-defined additional arguments.
   * @zh support - 由 Adapter 定义的额外参数。
   * @ja support - Adapter が定義する追加の引数です。
   * @returns The Adapter-defined bulk-update result.
   * @zh 由 Adapter 定义的批量更新结果。
   * @ja Adapter が定義する一括 update の結果です。
   */
  async update(
    data: Partial<RowFromSchema<Schema>>,
    ...support: AdapterUpdateByQueryCallArguments<AdapterInstance>
  ): Promise<AdapterUpdateByQueryResult<AdapterInstance>> {
    void support;
    this.#updateData = data;
    const adapter = this.#adapter as unknown as {
      updateByQuery(query: AdapterUpdateByQueryType<AdapterInstance>): Promise<AdapterUpdateByQueryResult<AdapterInstance>>;
    };
    return await adapter.updateByQuery(
      this.#adapterData() as unknown as AdapterUpdateByQueryType<AdapterInstance>,
    );
  }

  /**
   * Deletes rows matching the current condition.
   * @zh 删除符合当前条件的数据行。
   * @ja 現在の条件に一致するデータ行を削除します。
   * @returns The Adapter-defined bulk-delete result.
   * @zh 由 Adapter 定义的批量删除结果。
   * @ja Adapter が定義する一括 delete の結果です。
   */
  async delete(): Promise<AdapterDeleteByQueryResult<AdapterInstance>> {
    const adapter = this.#adapter as unknown as {
      deleteByQuery(query: AdapterDeleteQueryType<AdapterInstance>): Promise<AdapterDeleteByQueryResult<AdapterInstance>>;
    };
    return await adapter.deleteByQuery(
      this.#adapterData() as unknown as AdapterDeleteQueryType<AdapterInstance>,
    );
  }

  /**
   * Executes an Adapter-specific raw operation using the connection selected by
   * {@link conn}.
   * @zh 使用以下位置所选的连接执行 Adapter 特有的原始操作：
   * {@link conn}。
   * @ja {@link conn} で選択された接続を使用して、Adapter 固有の生の操作を実行します。
   * @param arguments_ - Adapter-defined execute arguments.
   * @zh arguments_ - 由 Adapter 定义的 execute 参数。
   * @ja arguments_ - Adapter が定義する execute 引数です。
   * @returns The Adapter-defined execution result.
   * @zh 由 Adapter 定义的执行结果。
   * @ja Adapter が定義する実行結果です。
   */
  async execute(
    ...arguments_: AdapterQueryExecuteArguments<AdapterInstance>
  ): Promise<AdapterExecuteResult<AdapterInstance>> {
    const adapter = this.#adapter as unknown as {
      execute(connection: AdapterConnection<AdapterInstance> | null, ...values: AdapterQueryExecuteArguments<AdapterInstance>): Promise<AdapterExecuteResult<AdapterInstance>>;
    };
    return await adapter.execute(this.#connection, ...arguments_);
  }

  /**
   * Finds rows using the current Query state.
   *
   * By default, the result is an array of Yukari rows. Passing `true` returns
   * plain objects serialized through Field Types. `single: true` requests one
   * result and changes the return type to a row or `null`; `noCache: true`
   * tells the Adapter to bypass query caching. The boolean and options object
   * may be passed in either supported order.
   * @zh 使用当前 Query 状态查找数据行。
   *
   * 默认返回 Yukari 数据行数组。传入 `true` 会返回通过 Field Type 序列化的普通对象。`single: true` 会请求一个结果，并把返回类型改为一行数据或 `null`；`noCache: true`
   * 会通知 Adapter 绕过查询缓存。布尔值和选项对象可以按任一受支持顺序传入。
   * @ja 現在の Query 状態を使用してデータ行を検索します。
   *
   * 既定では Yukari のデータ行の配列を返します。`true` を渡すと、Field Type を介してシリアライズされた plain object を返します。`single: true` は結果を 1 件だけ要求し、戻り値の型を 1 行または `null` に変更します。`noCache: true` はクエリキャッシュを使用しないよう Adapter に指示します。boolean とオプションオブジェクトは、対応するどちらの順序でも渡せます。
   * @returns Many rows by default, or one row when `single: true`.
   * @zh 默认返回多行；以下选项启用时返回一行：`single: true`。
   * @ja 既定では複数行、`single: true` の場合は 1 行です。
   * @example
   * ```ts
   * await User.where({ active: true }).find();
   * await User.where({ active: true }).find(true);
   * await User.where({ active: true }).find({ single: true });
   * ```
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
  async find(
    toJSONOrOptions: boolean | QueryFindOptions = false,
    maybeOptions?: boolean | QueryFindOptions,
  ): Promise<
    | readonly QueriedYukari<Name, Schema, AdapterInstance>[]
    | QueriedYukari<Name, Schema, AdapterInstance>
    | readonly QueryJsonRow<Schema>[]
    | QueryJsonRow<Schema>
    | null
  > {
    let toJSON = false;
    let options: QueryFindOptions = {};
    for (const argument of [toJSONOrOptions, maybeOptions]) {
      if (typeof argument === 'boolean') toJSON = argument;
      else if (argument !== null && typeof argument === 'object') options = argument;
    }
    const normalizedOptions = options;
    const single = Boolean(normalizedOptions.single);
    const result = await this.fetch({
      noCache: Boolean(normalizedOptions.noCache),
      single,
    });

    if (single) {
      if (!result) return result as null;
      const row = this.hydrate(result as AdapterRow);
      return toJSON ? row.toJSON() : row;
    }

    if (!result || !isReadonlyArray(result) || result.length === 0) {
      return result as unknown as readonly QueriedYukari<Name, Schema, AdapterInstance>[];
    }

    const rows = result.map((row) => this.hydrate(row));
    return toJSON ? rows.map((row) => row.toJSON()) : rows;
  }

  /**
   * Finds at most one row using the current Query state.
   * @zh 使用当前 Query 状态查找至多一行数据。
   * @ja 現在の Query 状態を使用して最大 1 行を検索します。
   * @returns The first row, or `null` when no row matches.
   * @zh 第一行数据，或 `null` 表示没有匹配的数据行。
   * @ja 最初のデータ行です。一致する行がない場合は `null` です。
   */
  findOne(): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  findOne(toJSON: false): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  findOne(toJSON: true): Promise<QueryJsonRow<Schema> | null>;
  async findOne(
    toJSON = false,
  ): Promise<QueriedYukari<Name, Schema, AdapterInstance> | QueryJsonRow<Schema> | null> {
    const result = await this.fetch({ noCache: false, single: true });
    if (!result) return result as null;
    const row = this.hydrate(result as AdapterRow);
    return toJSON ? row.toJSON() : row;
  }

  /**
   * Finds one row by its primary-key value or values.
   *
   * A Model with one primary key accepts the value directly. Composite keys
   * require an object. With a configured Cache, this first attempts a Cache
   * read; Cache errors fall back to the Adapter.
   * @zh 按主键值查找一行数据。
   *
   * 只有一个主键的 Model 可以直接接受该值；复合主键需要对象。配置 Cache 后会先尝试读取 Cache；Cache 出错时回退到 Adapter。
   * @ja 主キー値で 1 行を検索します。
   *
   * 主キーが 1 個の Model では値を直接渡せます。複合主キーにはオブジェクトが必要です。Cache が設定されている場合は、最初に Cache からの読み取りを試みます。Cache でエラーが発生した場合は Adapter へフォールバックします。
   * @param id - Primary-key value or composite-key object.
   * @zh id - 主键值或复合主键对象。
   * @ja id - 主キー値、または複合主キーオブジェクトです。
   * @returns The matching row, or `null`.
   * @zh 匹配的数据行，或 `null`。
   * @ja 一致するデータ行、または `null` です。
   * @throws When a primitive ID is supplied to a Model without exactly one
   * primary key.
   * @zh 向没有且仅有一个主键的 Model 传入原始类型 ID 时。
   * @ja 主キーが 1 個だけではない Model にプリミティブ値の ID を渡した場合です。
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
  async findById(
    id: FindByIdInput<Schema>,
    toJSON = false,
  ): Promise<QueriedYukari<Name, Schema, AdapterInstance> | QueryJsonRow<Schema> | null> {
    const condition = this.primaryKeyCondition(id);
    this.where(condition);

    if (this.#cache) {
      let data: readonly (AdapterRow | null)[] = [];
      try {
        data = await this.#cache.getData<AdapterRow>(
          this.#toshihiko.database,
          this.#model.name,
          condition,
        );
      } catch {
        data = [];
      }

      if (data.length !== 0) {
        const row = this.hydrate(data[0] as AdapterRow);
        return toJSON ? row.toJSON() : row;
      }
    }

    return toJSON ? await this.findOne(true) : await this.findOne(false);
  }

  #adapterData(): QueryAdapterData<Name, Schema, AdapterInstance> {
    return {
      cache: this.#cache,
      connection: this.#connection,
      fields: [...this.#fields],
      index: this.#index,
      limit: [...this.#limit],
      model: this.#model,
      order: [...this.#order],
      updateData: { ...this.#updateData },
      where: this.#where,
    };
  }

  private async fetch(options: AdapterFindOptions): Promise<AdapterFindResult> {
    return this.#adapter.find(
      this.#adapterData() as AdapterQueryType<AdapterInstance>,
      options,
    );
  }

  private hydrate(row: AdapterRow): QueriedYukari<Name, Schema, AdapterInstance> {
    if (row instanceof Yukari) {
      return row as QueriedYukari<Name, Schema, AdapterInstance>;
    }

    const yukari = new Yukari<Name, Schema, AdapterInstance>(
      this.#model,
      'query',
      row,
      true,
    );
    return yukari as QueriedYukari<Name, Schema, AdapterInstance>;
  }

  private primaryKeyCondition(
    id: FindByIdInput<Schema>,
  ): QueryWhere<RowFromSchema<Schema>> {
    const primaryKeys = this.#model.primaryKeys;
    if (primaryKeys.length === 1 && typeof id !== 'object') {
      return {
        [primaryKeys[0]!.name]: id,
      } as QueryWhere<RowFromSchema<Schema>>;
    }

    if (typeof id !== 'object') {
      throw new Error('you should pass a valid IDs object');
    }
    return id as QueryWhere<RowFromSchema<Schema>>;
  }
}

function normalizeLimit(value: number | string | readonly (number | string)[]): number {
  if (isReadonlyArray(value)) {
    return normalizeLimit(value[0] ?? 0);
  }
  const normalized = parseInt(value as string);
  return Number.isNaN(normalized) ? 0 : normalized;
}

function normalizeOrder<Row extends object>(
  order: QueryOrder<Row>,
): Readonly<Record<string, number>>[] {
  if (typeof order === 'string') {
    return order.split(',').map(parseOrderFragment).filter(isDefined);
  }

  if (isReadonlyArray(order)) {
    return order.flatMap((entry) => typeof entry === 'string'
      ? [parseArrayOrderFragment(entry)]
      : normalizeOrderObject(entry));
  }

  return normalizeOrderObject(order);
}

function normalizeOrderObject(
  order: Readonly<Record<string, QueryOrderDirection | undefined>>,
): Readonly<Record<string, number>>[] {
  return Object.entries(order).map(([name, direction]) => ({
    [name.trim()]: normalizeOrderDirection(direction),
  }));
}

function parseOrderFragment(
  fragment: string,
): Readonly<Record<string, number>> | undefined {
  const [name, direction] = fragment.trim().split(/\s+/, 2);
  if (!name) {
    return undefined;
  }
  return { [name]: normalizeOrderDirection(direction) };
}

function parseArrayOrderFragment(
  fragment: string,
): Readonly<Record<string, number>> {
  const parts = fragment.split(' ');
  return {
    [parts[0]!.trim()]: normalizeOrderDirection(parts[1] || 'ASC'),
  };
}

function normalizeOrderDirection(
  direction: QueryOrderDirection | string | undefined,
): number {
  if (direction === undefined) {
    return 1;
  }
  if (typeof direction === 'number') {
    return direction;
  }
  return direction.toUpperCase() === 'ASC' ? 1 : -1;
}

function isDefined<Value>(value: Value | undefined): value is Value {
  return value !== undefined;
}

function isReadonlyArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}
