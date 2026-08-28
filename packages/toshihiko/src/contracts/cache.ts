export type CacheKey = unknown;

export interface Cache<Value = unknown> {
  deleteData(
    database: string,
    table: string,
    key: CacheKey,
  ): Promise<unknown>;
  deleteKeys(
    database: string,
    table: string,
    keys: readonly CacheKey[],
  ): Promise<unknown>;
  getData(
    database: string,
    table: string,
    keys: CacheKey | readonly CacheKey[],
  ): Promise<Value[]>;
  setData(
    database: string,
    table: string,
    key: CacheKey,
    data: Value,
  ): Promise<unknown>;
}

export interface CacheModule {
  create(...arguments_: readonly unknown[]): Cache;
}

export interface CacheOptions {
  readonly [key: string]: unknown;
  readonly module?: CacheModule;
  readonly name?: string;
  readonly path?: string;
}

export type CacheSource = Cache | CacheOptions;

const stripComments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const argumentNames = /([^\s,]+)/g;

export function createCache(source: unknown): Cache | null {
  if (isCache(source)) return source;

  const options = source as CacheOptions;
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

export function isCache(value: unknown): value is Cache {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
    return false;
  }
  const candidate = value as Partial<Cache>;
  return typeof candidate.deleteData === 'function'
    && typeof candidate.deleteKeys === 'function'
    && typeof candidate.getData === 'function'
    && typeof candidate.setData === 'function';
}

function getParameterNames(func: (...arguments_: readonly unknown[]) => unknown): string[] {
  const source = func.toString().replace(stripComments, '');
  const result = source
    .slice(source.indexOf('(') + 1, source.indexOf(')'))
    .match(argumentNames);
  return result === null ? [] : result;
}
