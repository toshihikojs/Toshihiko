import { EventEmitter2 } from 'eventemitter2';
import type {
  Adapter as AdapterContract,
  AdapterData as AdapterDataContract,
  AdapterFindOptions as AdapterFindOptionsContract,
  AdapterFindResult as AdapterFindResultContract,
  AdapterOperationResult,
  AdapterQuery as AdapterQueryContract,
  AdapterRow as AdapterRowContract,
  AdapterExecuteSpec,
  DefaultAdapterExecuteSpec,
  DataRow,
  DataValue,
} from 'toshihiko';
import { extend } from './util';

/**
 * Field/value pair passed to Adapter insert and update operations.
 * @zh 传给 Adapter insert 和 update 操作的 Field/值对。
 * @ja Adapter の insert および update 操作に渡す Field と値の組です。
 */
export type AdapterData<Field = object, Value = DataValue> = AdapterDataContract<Field, Value>;

/**
 * Options supplied to Adapter find operations.
 * @zh 传给 Adapter find 操作的选项。
 * @ja Adapter の find 操作に渡すオプションです。
 */
export type AdapterFindOptions = AdapterFindOptionsContract;

/**
 * Row, row array, or `null` returned by Adapter find operations.
 * @zh 一行数据、数据行数组或 `null`，由 Adapter 的查找操作返回。
 * @ja Adapter の find 操作が返すデータ行、データ行の配列、または `null` です。
 */
export type AdapterFindResult = AdapterFindResultContract;

/**
 * Normalized Query state consumed by an Adapter.
 * @zh Adapter 使用的规范化 Query 状态。
 * @ja Adapter が処理する正規化済みの Query 状態です。
 */
export type AdapterQuery<
  Model = object,
  Connection = object,
  Cache = object | null,
  UpdateData extends object = DataRow,
  Where extends object = DataRow,
> = AdapterQueryContract<Model, Connection, Cache, UpdateData, Where>;

/**
 * Storage row returned by an Adapter.
 * @zh Adapter 返回的存储层数据行。
 * @ja Adapter が返すストレージ上のデータ行です。
 */
export type AdapterRow = AdapterRowContract;

/**
 * Default unstructured option shape for Adapter subclasses.
 * @zh Adapter 子类默认使用的非结构化选项类型。
 * @ja Adapter のサブクラスが既定で使用する、構造を規定しないオプション型です。
 */
export type DefaultAdapterOptions = Readonly<Record<string, DataValue>>;

/**
 * Base class for Toshihiko database adapter implementations.
 *
 * Every operation rejects asynchronously with a descriptive “not implemented”
 * error until a subclass overrides it. The base constructor copies options and
 * retains the parent Toshihiko instance when one is supplied.
 * @zh Toshihiko 数据库 Adapter 实现的基类。
 *
 * 在子类覆盖前，每个操作都会以描述性的“未实现”错误异步拒绝。基类构造函数会复制选项，并在传入上级 Toshihiko 实例时保留它。
 * @ja Toshihiko のデータベース Adapter 実装の基底クラスです。
 *
 * サブクラスがオーバーライドするまで、各操作は「未実装」であることを示すエラーによって非同期に reject されます。基底コンストラクターはオプションをコピーし、親の Toshihiko インスタンスが渡された場合はそれを保持します。
 * @category Extension API
 * @zh 扩展 API
 * @ja 拡張 API
 */
export class Adapter<
  Options extends object = DefaultAdapterOptions,
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
> extends EventEmitter2 implements AdapterContract<
  Model,
  Connection,
  Field,
  Value,
  Query,
  ExecuteSpec
> {
  /**
   * Parent Toshihiko instance when constructed by Toshihiko.
   * @zh 由 Toshihiko 构造时传入的上级 Toshihiko 实例。
   * @ja Toshihiko によって構築された場合の親 Toshihiko インスタンスです。
   */
  declare readonly parent: object | undefined;
  /**
   * Mutable copy of Adapter-specific options.
   * @zh Adapter 特有选项的可变副本。
   * @ja Adapter 固有のオプションをコピーした変更可能なオブジェクトです。
   */
  declare options: Options;

  constructor(
    ...[options]: {} extends Options
      ? readonly [options?: Options | null]
      : readonly [options: Options]
  );
  constructor(parent: object, options: Options | null | undefined);
  constructor(
    parentOrOptions?: object | null,
    adapterOptions?: Options | null,
  ) {
    super();
    const hasParent = arguments.length >= 2 && adapterOptions !== undefined;
    const parent = hasParent ? parentOrOptions ?? undefined : undefined;
    const options = (hasParent ? adapterOptions : parentOrOptions) as Options | null | undefined;
    if (hasParent) {
      Object.defineProperty(this, 'parent', {
        configurable: false,
        enumerable: false,
        value: parent,
        writable: false,
      });
    }
    Object.defineProperty(this, 'options', {
      configurable: false,
      enumerable: true,
      value: copyOptions(options),
      writable: true,
    });
  }

  /**
   * Finds rows for a normalized Query; subclasses must override this method.
   * @zh 查找规范化 Query 对应的数据行；子类必须覆盖此方法。
   * @ja 正規化済みの Query に対応するデータ行を検索します。サブクラスはこのメソッドをオーバーライドする必要があります。
   */
  async find(
    query: Query,
    options?: AdapterFindOptions,
  ): Promise<AdapterFindResult> {
    void query;
    void options;
    return this.notImplemented('find');
  }

  /**
   * Counts rows for a normalized Query; subclasses must override this method.
   * @zh 统计规范化 Query 对应的数据行；子类必须覆盖此方法。
   * @ja 正規化済みの Query に対応するデータ行数を数えます。サブクラスはこのメソッドをオーバーライドする必要があります。
   */
  async count(query: Query): Promise<number> {
    void query;
    return this.notImplemented('count');
  }

  /**
   * Performs a bulk update; subclasses may override this optional operation.
   * @zh 执行批量更新；子类可以覆盖这个可选操作。
   * @ja 一括更新を実行します。サブクラスはこの任意操作をオーバーライドできます。
   */
  async updateByQuery(
    query: Query,
  ): Promise<AdapterOperationResult> {
    void query;
    return this.notImplemented('updateByQuery');
  }

  /**
   * Deletes rows for a normalized Query; subclasses must override this method.
   * @zh 删除规范化 Query 对应的数据行；子类必须覆盖此方法。
   * @ja 正規化済みの Query に対応するデータ行を削除します。サブクラスはこのメソッドをオーバーライドする必要があります。
   */
  async deleteByQuery(
    query: Query,
  ): Promise<AdapterOperationResult> {
    void query;
    return this.notImplemented('deleteByQuery');
  }

  /**
   * Inserts one row; subclasses must override this method.
   * @zh 插入一行数据；子类必须覆盖此方法。
   * @ja 1 行を挿入します。サブクラスはこのメソッドをオーバーライドする必要があります。
   */
  async insert(
    model: Model,
    connection: Connection | null,
    data: readonly AdapterData<Field, Value>[],
  ): Promise<AdapterRow | null> {
    void model;
    void connection;
    void data;
    return this.notImplemented('insert');
  }

  /**
   * Updates one located row; subclasses must override this method.
   * @zh 更新已经定位的一行数据；子类必须覆盖此方法。
   * @ja 特定済みの 1 行を更新します。サブクラスはこのメソッドをオーバーライドする必要があります。
   */
  async update(
    model: Model,
    connection: Connection | null,
    primaryKey: DataRow,
    data: readonly AdapterData<Field, Value>[],
  ): Promise<AdapterOperationResult> {
    void model;
    void connection;
    void primaryKey;
    void data;
    return this.notImplemented('update');
  }

  /**
   * Executes an Adapter-specific raw operation; subclasses may override it.
   * @zh 执行 Adapter 特有的原始操作；子类可以覆盖此方法。
   * @ja Adapter 固有の生の操作を実行します。サブクラスはこのメソッドをオーバーライドできます。
   */
  async execute(
    ...arguments_: ExecuteSpec['arguments']
  ): Promise<ExecuteSpec['result']> {
    void arguments_;
    return this.notImplemented('execute');
  }

  /**
   * Returns the current database name; the base implementation returns `''`.
   * @zh 返回当前数据库名；基类实现返回 `''`。
   * @ja 現在のデータベース名を返します。基底実装は `''` を返します。
   */
  getDBName(): string {
    return '';
  }

  /**
   * Begins a transaction; subclasses may override this optional operation.
   * @zh 开始事务；子类可以覆盖这个可选操作。
   * @ja トランザクションを開始します。サブクラスはこの任意操作をオーバーライドできます。
   */
  async beginTransaction(): Promise<Connection> {
    return this.notImplemented('beginTransaction');
  }

  /**
   * Commits a transaction; subclasses may override this optional operation.
   * @zh 提交事务；子类可以覆盖这个可选操作。
   * @ja トランザクションをコミットします。サブクラスはこの任意操作をオーバーライドできます。
   */
  async commit(connection: Connection): Promise<void> {
    void connection;
    return this.notImplemented('commit');
  }

  /**
   * Rolls back a transaction; subclasses may override this optional operation.
   * @zh 回滚事务；子类可以覆盖这个可选操作。
   * @ja トランザクションをロールバックします。サブクラスはこの任意操作をオーバーライドできます。
   */
  async rollback(connection: Connection): Promise<void> {
    void connection;
    return this.notImplemented('rollback');
  }

  protected notImplemented(method: string): Promise<never> {
    return new Promise((_resolve, reject) => {
      process.nextTick(() => reject(
        new Error(`this adapter's ${method} function is not implemented yet.`),
      ));
    });
  }
}

function copyOptions<Options extends object>(
  options: Options | null | undefined,
): Options {
  if (options === null || options === undefined) {
    return {} as Options;
  }

  return extend({}, options) as Options;
}

export { extend };
export default Adapter;
