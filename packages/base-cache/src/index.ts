import { EventEmitter } from 'node:events';
import type {
  Cache as CacheContract,
  CacheKey,
} from 'toshihiko';

export abstract class Cache<Value = unknown>
  extends EventEmitter
  implements CacheContract<Value> {
  abstract deleteData(
    database: string,
    table: string,
    key: CacheKey,
  ): Promise<unknown>;

  abstract deleteKeys(
    database: string,
    table: string,
    keys: readonly CacheKey[],
  ): Promise<unknown>;

  abstract getData(
    database: string,
    table: string,
    keys: CacheKey | readonly CacheKey[],
  ): Promise<Value[]>;

  abstract setData(
    database: string,
    table: string,
    key: CacheKey,
    data: Value,
  ): Promise<unknown>;
}

export type {
  CacheContract,
  CacheKey,
};
