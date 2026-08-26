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

export interface AdapterTypeMap {
  readonly connection: unknown;
  readonly executeArguments: readonly unknown[];
  readonly executeResult: unknown;
  readonly field: unknown;
  readonly fieldValue: unknown;
  readonly findResult: AdapterFindResult;
  readonly insertResult: AdapterRow | null;
  readonly mutationResult: unknown;
  readonly options: object;
  readonly query: AdapterQuery;
}

export interface DefaultAdapterTypeMap extends AdapterTypeMap {
  readonly connection: unknown;
  readonly executeArguments: readonly unknown[];
  readonly executeResult: unknown;
  readonly field: unknown;
  readonly fieldValue: unknown;
  readonly findResult: AdapterFindResult;
  readonly insertResult: AdapterRow | null;
  readonly mutationResult: unknown;
  readonly options: Readonly<Record<string, unknown>>;
  readonly query: AdapterQuery;
}

type AdapterModel<Types extends AdapterTypeMap> =
  Types['query'] extends AdapterQuery<infer Model> ? Model : unknown;

export class AdapterNotImplementedError extends Error {
  readonly method: string;

  constructor(method: string) {
    super(`this adapter's ${method} function is not implemented yet.`);
    this.name = 'AdapterNotImplementedError';
    this.method = method;
  }
}

export class Adapter<
  Types extends AdapterTypeMap = DefaultAdapterTypeMap,
> extends EventEmitter {
  readonly options: Types['options'];

  constructor(options?: Types['options'] | null) {
    super();
    this.options = copyOptions(options);
  }

  async find(
    query: Types['query'],
    options?: AdapterFindOptions,
  ): Promise<Types['findResult']> {
    void query;
    void options;
    return this.notImplemented('find');
  }

  async count(query: Types['query']): Promise<number> {
    void query;
    return this.notImplemented('count');
  }

  async updateByQuery(
    query: Types['query'],
  ): Promise<Types['mutationResult']> {
    void query;
    return this.notImplemented('updateByQuery');
  }

  async deleteByQuery(
    query: Types['query'],
  ): Promise<Types['mutationResult']> {
    void query;
    return this.notImplemented('deleteByQuery');
  }

  async insert(
    model: AdapterModel<Types>,
    connection: Types['connection'] | null,
    data: readonly AdapterData<Types['field'], Types['fieldValue']>[],
  ): Promise<Types['insertResult']> {
    void model;
    void connection;
    void data;
    return this.notImplemented('insert');
  }

  async update(
    model: AdapterModel<Types>,
    connection: Types['connection'] | null,
    primaryKey: Readonly<Record<string, unknown>>,
    data: readonly AdapterData<Types['field'], Types['fieldValue']>[],
  ): Promise<Types['mutationResult']> {
    void model;
    void connection;
    void primaryKey;
    void data;
    return this.notImplemented('update');
  }

  async execute(
    ...arguments_: Types['executeArguments']
  ): Promise<Types['executeResult']> {
    void arguments_;
    return this.notImplemented('execute');
  }

  getDBName(): string {
    return '';
  }

  async beginTransaction(): Promise<Types['connection']> {
    return this.notImplemented('beginTransaction');
  }

  async commit(connection: Types['connection']): Promise<void> {
    void connection;
    return this.notImplemented('commit');
  }

  async rollback(connection: Types['connection']): Promise<void> {
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
