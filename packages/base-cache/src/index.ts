import { EventEmitter } from 'node:events';
import type {
  Cache as CacheContract,
  CacheDeleteKeysResult,
  CacheDeleteResult,
  CacheKey,
  CacheSetResult,
} from 'toshihiko';

export abstract class Cache
  extends EventEmitter
  implements CacheContract {
  abstract deleteData(
    database: string,
    table: string,
    key: CacheKey,
  ): Promise<CacheDeleteResult>;

  abstract deleteKeys(
    database: string,
    table: string,
    keys: readonly CacheKey[],
  ): Promise<CacheDeleteKeysResult>;

  abstract getData<Value extends object>(
    database: string,
    table: string,
    keys: CacheKey | readonly CacheKey[],
  ): Promise<(Value | null)[]>;

  abstract setData<Value extends object>(
    database: string,
    table: string,
    key: CacheKey,
    data: Value,
  ): Promise<CacheSetResult>;
}

export type {
  CacheContract,
  CacheDeleteKeysResult,
  CacheDeleteResult,
  CacheKey,
  CacheSetResult,
};
