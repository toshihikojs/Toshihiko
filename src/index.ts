import { EventEmitter } from 'eventemitter3';
import type {
  AdapterFindOptions,
  AdapterFindResult,
  AdapterQuery,
  AdapterRow,
} from 'toshihiko';
import { extend } from './util';

export interface AdapterData<Field = unknown, Value = unknown> {
  readonly field: Field;
  readonly value: Value;
}

export type DefaultAdapterOptions = Readonly<Record<string, unknown>>;

export class AdapterNotImplementedError extends Error {
  readonly method: string;

  constructor(method: string) {
    super(`this adapter's ${method} function is not implemented yet.`);
    this.name = 'AdapterNotImplementedError';
    this.method = method;
  }
}

export class Adapter<
  Options extends object = DefaultAdapterOptions,
> extends EventEmitter {
  readonly options: Options;

  constructor(options?: Options | null) {
    super();
    this.options = copyOptions(options);
  }

  async find(
    query: AdapterQuery,
    options?: AdapterFindOptions,
  ): Promise<AdapterFindResult> {
    void query;
    void options;
    return this.notImplemented('find');
  }

  async count(query: AdapterQuery): Promise<number> {
    void query;
    return this.notImplemented('count');
  }

  async updateByQuery(
    query: AdapterQuery,
  ): Promise<unknown> {
    void query;
    return this.notImplemented('updateByQuery');
  }

  async deleteByQuery(
    query: AdapterQuery,
  ): Promise<unknown> {
    void query;
    return this.notImplemented('deleteByQuery');
  }

  async insert(
    model: unknown,
    connection: unknown,
    data: readonly AdapterData[],
  ): Promise<AdapterRow | null> {
    void model;
    void connection;
    void data;
    return this.notImplemented('insert');
  }

  async update(
    model: unknown,
    connection: unknown,
    primaryKey: Readonly<Record<string, unknown>>,
    data: readonly AdapterData[],
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

  async beginTransaction(): Promise<unknown> {
    return this.notImplemented('beginTransaction');
  }

  async commit(connection: unknown): Promise<void> {
    void connection;
    return this.notImplemented('commit');
  }

  async rollback(connection: unknown): Promise<void> {
    void connection;
    return this.notImplemented('rollback');
  }

  protected notImplemented(method: string): never {
    throw new AdapterNotImplementedError(method);
  }
}

function copyOptions<Options extends object>(
  options: Options | null | undefined,
): Options {
  return { ...(options ?? {}) } as Options;
}

export { extend };
export type {
  AdapterFindOptions,
  AdapterFindResult,
  AdapterQuery,
  AdapterRow,
};
