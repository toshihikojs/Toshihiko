import { EventEmitter } from 'node:events';
import type {
  Cache as ToshihikoCacheContract,
  CacheDeleteKeysResult as CacheDeleteKeysResultContract,
  CacheDeleteResult as CacheDeleteResultContract,
  CacheKey as CacheKeyContract,
  CacheSetResult as CacheSetResultContract,
} from 'toshihiko';

/** Lookup key accepted by Cache implementations. */
export type CacheKey = CacheKeyContract;

/** Result returned after deleting one cached row. */
export type CacheDeleteResult = CacheDeleteResultContract;

/** Result returned after deleting multiple cached rows. */
export type CacheDeleteKeysResult = CacheDeleteKeysResultContract;

/** Result returned after writing one cached row. */
export type CacheSetResult = CacheSetResultContract;

/** Structural contract implemented by Toshihiko Cache backends. */
export type CacheContract = ToshihikoCacheContract;

/**
 * Base class for Toshihiko cache implementations.
 *
 * @category Extension API
 */
export abstract class Cache
  extends EventEmitter
  implements ToshihikoCacheContract {
  /** Deletes one cached row. */
  abstract deleteData(
    database: string,
    table: string,
    key: CacheKey,
  ): Promise<CacheDeleteResult>;

  /** Deletes cached rows for multiple keys. */
  abstract deleteKeys(
    database: string,
    table: string,
    keys: readonly CacheKey[],
  ): Promise<CacheDeleteKeysResult>;

  /** Reads cached rows in request order, using `null` for a cache miss. */
  abstract getData<Value extends object>(
    database: string,
    table: string,
    keys: CacheKey | readonly CacheKey[],
  ): Promise<(Value | null)[]>;

  /** Stores one serialized row under a Cache key. */
  abstract setData<Value extends object>(
    database: string,
    table: string,
    key: CacheKey,
    data: Value,
  ): Promise<CacheSetResult>;
}
