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

/** Field/value pair passed to Adapter insert and update operations. */
export type AdapterData<Field = object, Value = DataValue> = AdapterDataContract<Field, Value>;

/** Options supplied to Adapter find operations. */
export type AdapterFindOptions = AdapterFindOptionsContract;

/** Row, row array, or `null` returned by Adapter find operations. */
export type AdapterFindResult = AdapterFindResultContract;

/** Normalized Query state consumed by an Adapter. */
export type AdapterQuery<
  Model = object,
  Connection = object,
  Cache = object | null,
  UpdateData extends object = DataRow,
  Where extends object = DataRow,
> = AdapterQueryContract<Model, Connection, Cache, UpdateData, Where>;

/** Storage row returned by an Adapter. */
export type AdapterRow = AdapterRowContract;

/** Default unstructured option shape for Adapter subclasses. */
export type DefaultAdapterOptions = Readonly<Record<string, DataValue>>;

/**
 * Base class for Toshihiko database adapter implementations.
 *
 * Every operation rejects asynchronously with a descriptive “not implemented”
 * error until a subclass overrides it. The base constructor copies options and
 * retains the parent Toshihiko instance when one is supplied.
 *
 * @category Extension API
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
  /** Parent Toshihiko instance when constructed by Toshihiko. */
  declare readonly parent: object | undefined;
  /** Mutable copy of Adapter-specific options. */
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

  /** Finds rows for a normalized Query; subclasses must override this method. */
  async find(
    query: Query,
    options?: AdapterFindOptions,
  ): Promise<AdapterFindResult> {
    void query;
    void options;
    return this.notImplemented('find');
  }

  /** Counts rows for a normalized Query; subclasses must override this method. */
  async count(query: Query): Promise<number> {
    void query;
    return this.notImplemented('count');
  }

  /** Performs a bulk update; subclasses may override this optional operation. */
  async updateByQuery(
    query: Query,
  ): Promise<AdapterOperationResult> {
    void query;
    return this.notImplemented('updateByQuery');
  }

  /** Deletes rows for a normalized Query; subclasses must override this method. */
  async deleteByQuery(
    query: Query,
  ): Promise<AdapterOperationResult> {
    void query;
    return this.notImplemented('deleteByQuery');
  }

  /** Inserts one row; subclasses must override this method. */
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

  /** Updates one located row; subclasses must override this method. */
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

  /** Executes an Adapter-specific raw operation; subclasses may override it. */
  async execute(
    ...arguments_: ExecuteSpec['arguments']
  ): Promise<ExecuteSpec['result']> {
    void arguments_;
    return this.notImplemented('execute');
  }

  /** Returns the current database name; the base implementation returns `''`. */
  getDBName(): string {
    return '';
  }

  /** Begins a transaction; subclasses may override this optional operation. */
  async beginTransaction(): Promise<Connection> {
    return this.notImplemented('beginTransaction');
  }

  /** Commits a transaction; subclasses may override this optional operation. */
  async commit(connection: Connection): Promise<void> {
    void connection;
    return this.notImplemented('commit');
  }

  /** Rolls back a transaction; subclasses may override this optional operation. */
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
