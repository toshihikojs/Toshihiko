import {
  Cache,
  type CacheKey,
} from '@toshihiko/base-cache';
import MemcachedClient from 'memcached';

const memcachedCommandMaxLength = 250;

export type CustomizeKey = (
  this: MemcachedCache,
  database: string,
  table: string,
  key: CacheKey,
) => string;

export interface MemcachedCacheOptions extends MemcachedClient.options {
  prefix?: string;
  customizeKey?: CustomizeKey;
}

export class MemcachedCache extends Cache<unknown> {
  readonly memcached: MemcachedClient;
  readonly options: MemcachedCacheOptions | undefined;
  readonly prefix: string;
  readonly servers: MemcachedClient.Location;

  constructor(
    servers: MemcachedClient.Location,
    options?: MemcachedCacheOptions,
    client?: MemcachedClient,
  ) {
    super();
    this.servers = servers;
    this.options = options;
    this.prefix = options?.prefix || '';
    if (options) delete options.prefix;
    this.memcached = client ?? new MemcachedClient(servers, options);

    this.memcached.on('failure', (details) => this.emit('failure', details));
    this.memcached.on('reconnecting', (details) => this.emit('reconnecting', details));

    if (options?.customizeKey) {
      this._getKey = options.customizeKey.bind(this);
    }
  }

  setCustomizeKeyFunc(func: CustomizeKey): void {
    this._getKey = func.bind(this);
  }

  _getKey(database: string, table: string, key: CacheKey): string {
    if (typeof key !== 'object') {
      return `${this.prefix}${database}:${table}:${String(key)}`;
    }
    if (key === null) return `${this.prefix}${database}:${table}`;

    const values = key as Readonly<Record<string, unknown>>;
    const keys = Object.keys(values);
    if (keys.length === 0) {
      return `${this.prefix}${database}:${table}`;
    }
    if (keys.length === 1) {
      return `${this.prefix}${database}:${table}:${String(values[keys[0]!])}`;
    }

    let minimumLength = 1;
    for (let left = 0; left < keys.length; left++) {
      for (let right = left + 1; right < keys.length; right++) {
        const leftKey = keys[left]!;
        const rightKey = keys[right]!;
        const length = Math.min(leftKey.length, rightKey.length);
        let index = 0;
        for (; index < length; index++) {
          if (leftKey[index] !== rightKey[index]) {
            if (index > minimumLength) minimumLength = index + 1;
            break;
          }
        }
        if (index === length && index > minimumLength) {
          minimumLength = index + 1;
        }
      }
    }

    keys.sort();
    let base = `${this.prefix}${database}:${table}`;
    for (const name of keys) {
      base += `:${name.slice(0, minimumLength)}${String(values[name])}`;
    }
    return base;
  }

  _getKeys(
    database: string,
    table: string,
    keys: readonly CacheKey[],
  ): string[] {
    return keys.map((key) => this._getKey(database, table, key));
  }

  async deleteData(
    database: string,
    table: string,
    key: CacheKey,
  ): Promise<boolean> {
    const cacheKey = this._getKey(database, table, key);
    return await new Promise<boolean>((resolve, reject) => {
      this.memcached.del(cacheKey, (error) => {
        if (error) reject(error);
        else resolve(true);
      });
    });
  }

  async deleteKeys(
    database: string,
    table: string,
    keys: readonly CacheKey[],
  ): Promise<void> {
    let index = 0;
    const workers = Array.from(
      { length: Math.min(10, keys.length) },
      async () => {
        while (index < keys.length) {
          const current = keys[index++]!;
          await this.deleteData(database, table, current);
        }
      },
    );
    await Promise.all(workers);
  }

  async setData(
    database: string,
    table: string,
    key: CacheKey,
    data: unknown,
  ): Promise<boolean> {
    const cacheKey = this._getKey(database, table, key);
    return await new Promise<boolean>((resolve, reject) => {
      this.memcached.set(cacheKey, data, 0, (error) => {
        if (error) reject(error);
        else resolve(true);
      });
    });
  }

  async getData(
    database: string,
    table: string,
    keys: CacheKey | readonly CacheKey[],
  ): Promise<unknown[]> {
    const normalized = Array.isArray(keys) ? keys : [keys];
    const cacheKeys = this._getKeys(database, table, normalized);
    if (cacheKeys.length === 0) return [];
    if (cacheKeys.length === 1) {
      const data = await this.get(cacheKeys[0]!);
      return data === undefined ? [] : [data];
    }

    const groups: string[][] = [[]];
    let command = 'get';
    for (const cacheKey of cacheKeys) {
      command += ` ${cacheKey}`;
      if (command.length > memcachedCommandMaxLength) {
        groups.push([]);
        command = `get ${cacheKey}`;
      }
      groups[groups.length - 1]!.push(cacheKey);
    }

    const result: unknown[] = [];
    for (const group of groups) {
      result.push(...await this.getMany(group));
    }
    return result;
  }

  private async get(key: string): Promise<unknown> {
    return await new Promise<unknown>((resolve, reject) => {
      this.memcached.get(key, (error, data) => {
        if (error) reject(error);
        else resolve(data);
      });
    });
  }

  private async getMany(keys: readonly string[]): Promise<unknown[]> {
    return await new Promise<unknown[]>((resolve, reject) => {
      this.memcached.getMulti([...keys], (error, data) => {
        if (error) {
          reject(error);
          return;
        }
        const result: unknown[] = [];
        for (const key of keys) {
          if (data[key]) result.push(data[key]);
        }
        resolve(result);
      });
    });
  }
}

export function create(
  servers: MemcachedClient.Location,
  options?: MemcachedCacheOptions,
): MemcachedCache {
  return new MemcachedCache(servers, options);
}
