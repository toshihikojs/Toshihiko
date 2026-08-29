import type { DataValue } from './common';

export type CacheKey =
  | object
  | string
  | number
  | bigint
  | boolean
  | symbol
  | null
  | undefined;

export type CacheDeleteResult = void | boolean | number;
export type CacheDeleteKeysResult = void | readonly number[];
export type CacheSetResult = void | boolean | 'OK' | null;

export interface Cache {
  deleteData(
    database: string,
    table: string,
    key: CacheKey,
  ): Promise<CacheDeleteResult>;
  deleteKeys(
    database: string,
    table: string,
    keys: readonly CacheKey[],
  ): Promise<CacheDeleteKeysResult>;
  getData<Value extends object>(
    database: string,
    table: string,
    keys: CacheKey | readonly CacheKey[],
  ): Promise<(Value | null)[]>;
  setData<Value extends object>(
    database: string,
    table: string,
    key: CacheKey,
    data: Value,
  ): Promise<CacheSetResult>;
}

export interface CacheModule {
  create(...arguments_: DataValue[]): Cache;
}

export interface CacheOptions {
  readonly [key: string]: DataValue;
  readonly module?: CacheModule;
  readonly name?: string;
  readonly path?: string;
}

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
