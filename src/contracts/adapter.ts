import type { ToshihikoOptions } from '../toshihiko';

export interface AdapterFindOptions {
  readonly noCache: boolean;
  readonly single: boolean;
}

export interface AdapterQuery<Model = unknown> {
  readonly _conn: unknown;
  readonly _fields: readonly string[];
  readonly _index: string;
  readonly _limit: readonly number[];
  readonly _order: readonly Readonly<Record<string, 1 | -1>>[];
  readonly _where: Readonly<Record<string, unknown>>;
  readonly model: Model;
}

export type AdapterRow = Readonly<Record<string, unknown>>;

export type AdapterFindResult =
  | AdapterRow
  | readonly AdapterRow[]
  | null;

export interface Adapter {
  find(
    query: AdapterQuery,
    options?: AdapterFindOptions,
  ): Promise<AdapterFindResult>;
  getDBName(): string;
}

export interface AdapterConstructor<
  Options extends ToshihikoOptions = ToshihikoOptions,
  Instance extends Adapter = Adapter,
> {
  new(options: Options): Instance;
}

export type AdapterSource<
  Options extends ToshihikoOptions = ToshihikoOptions,
  Instance extends Adapter = Adapter,
> = string | Instance | AdapterConstructor<Options, Instance>;
