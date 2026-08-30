import type { DataValue } from './common';

/** A single lookup key accepted by Cache implementations. */
export type CacheKey =
  | object
  | string
  | number
  | bigint
  | boolean
  | symbol
  | null
  | undefined;

/** Backend-specific result returned when deleting one cached row. */
export type CacheDeleteResult = void | boolean | number;
/** Backend-specific result returned when deleting multiple cached rows. */
export type CacheDeleteKeysResult = void | readonly number[];
/** Backend-specific result returned after writing one cached row. */
export type CacheSetResult = void | boolean | 'OK' | null;

/**
 * Contract implemented by a Toshihiko cache backend.
 *
 * @category Extension API
 */
export interface Cache {
  /**
   * Deletes one cached row.
   *
   * @param database - Database namespace.
   * @param table - Model or table namespace.
   * @param key - Row locator or serialized backend key.
   */
  deleteData(
    database: string,
    table: string,
    key: CacheKey,
  ): Promise<CacheDeleteResult>;
  /**
   * Deletes cached rows for multiple keys.
   *
   * @param database - Database namespace.
   * @param table - Model or table namespace.
   * @param keys - Keys to invalidate.
   */
  deleteKeys(
    database: string,
    table: string,
    keys: readonly CacheKey[],
  ): Promise<CacheDeleteKeysResult>;
  /**
   * Reads one or more cached rows.
   *
   * The returned array preserves request order; a cache miss occupies its slot
   * as `null`.
   *
   * @param database - Database namespace.
   * @param table - Model or table namespace.
   * @param keys - One key or an ordered list of keys.
   */
  getData<Value extends object>(
    database: string,
    table: string,
    keys: CacheKey | readonly CacheKey[],
  ): Promise<(Value | null)[]>;
  /**
   * Stores one serialized row.
   *
   * @param database - Database namespace.
   * @param table - Model or table namespace.
   * @param key - Row locator or serialized backend key.
   * @param data - Plain row data to cache.
   */
  setData<Value extends object>(
    database: string,
    table: string,
    key: CacheKey,
    data: Value,
  ): Promise<CacheSetResult>;
}

/** Legacy module shape used by {@link Toshihiko.createCache}. */
export interface CacheModule {
  /** Creates a Cache from positional configuration values. */
  create(...arguments_: DataValue[]): Cache;
}

/** Module-style Cache configuration retained for v1 compatibility. */
export interface CacheOptions {
  readonly [key: string]: DataValue;
  /** Already loaded module exposing a Cache factory. */
  readonly module?: CacheModule;
  /** Package suffix resolved as `@toshihiko/{name}-cache`. */
  readonly name?: string;
  /** Module path loaded with `require()`. */
  readonly path?: string;
}

/** Existing Cache instance or module-style Cache configuration. */
export type CacheSource = Cache | CacheOptions;

const stripComments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const argumentNames = /([^\s,]+)/g;

export function createCache(source: CacheSource): Cache | null {
  if (isCache(source)) return source;

  const options = source;
  let cacheModule: CacheModule;
  if (options.module) {
    cacheModule = options.module;
  } else if (options.path) {
    cacheModule = require(options.path) as CacheModule;
  } else if (options.name) {
    cacheModule = require(`@toshihiko/${options.name}-cache`) as CacheModule;
  } else {
    return null;
  }

  const names = getParameterNames(cacheModule.create);
  return cacheModule.create(...names.map((name) => options[name]));
}

export function isCache<Value>(value: Value): value is Value & Cache {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
    return false;
  }
  const candidate = value as Partial<Cache>;
  return typeof candidate.deleteData === 'function'
    && typeof candidate.deleteKeys === 'function'
    && typeof candidate.getData === 'function'
    && typeof candidate.setData === 'function';
}

function getParameterNames(func: (...arguments_: DataValue[]) => Cache): string[] {
  const source = func.toString().replace(stripComments, '');
  const result = source
    .slice(source.indexOf('(') + 1, source.indexOf(')'))
    .match(argumentNames);
  return result === null ? [] : result;
}
