import { EventEmitter2 } from 'eventemitter2';
import type {
  Adapter as AdapterContract,
  AdapterData,
  AdapterFindOptions,
  AdapterFindResult,
  AdapterQuery,
  AdapterRow,
} from 'toshihiko';
import { extend } from './util';

export type { AdapterData } from 'toshihiko';

export type DefaultAdapterOptions = Readonly<Record<string, unknown>>;

export class Adapter<
  Options extends object = DefaultAdapterOptions,
  Model = unknown,
  Connection = unknown,
  Field = unknown,
  Value = unknown,
  Query extends AdapterQuery<Model, Connection> = AdapterQuery<Model, Connection>,
> extends EventEmitter2 implements AdapterContract<
  Model,
  Connection,
  Field,
  Value,
  Query
> {
  declare options: Options;

  constructor(
    ...[options]: {} extends Options
      ? readonly [options?: Options | null]
      : readonly [options: Options]
  ) {
    super();
    Object.defineProperty(this, 'options', {
      configurable: false,
      enumerable: true,
      value: copyOptions(options),
      writable: true,
    });
  }

  async find(
    query: Query,
    options?: AdapterFindOptions,
  ): Promise<AdapterFindResult> {
    void query;
    void options;
    return this.notImplemented('find');
  }

  async count(query: Query): Promise<number> {
    void query;
    return this.notImplemented('count');
  }

  async updateByQuery(
    query: Query,
  ): Promise<unknown> {
    void query;
    return this.notImplemented('updateByQuery');
  }

  async deleteByQuery(
    query: Query,
  ): Promise<unknown> {
    void query;
    return this.notImplemented('deleteByQuery');
  }

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

  async update(
    model: Model,
    connection: Connection | null,
    primaryKey: Readonly<Record<string, unknown>>,
    data: readonly AdapterData<Field, Value>[],
  ): Promise<unknown> {
    void model;
    void connection;
    void primaryKey;
    void data;
    return this.notImplemented('update');
  }

  async execute(
    ...arguments_: readonly unknown[]
  ): Promise<unknown> {
    void arguments_;
    return this.notImplemented('execute');
  }

  getDBName(): string {
    return '';
  }

  async beginTransaction(): Promise<Connection> {
    return this.notImplemented('beginTransaction');
  }

  async commit(connection: Connection): Promise<void> {
    void connection;
    return this.notImplemented('commit');
  }

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
export type {
  AdapterFindOptions,
  AdapterFindResult,
  AdapterQuery,
  AdapterRow,
};
