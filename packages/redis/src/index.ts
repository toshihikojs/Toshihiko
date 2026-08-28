import {
  Cache,
  type CacheKey,
} from '@toshihiko/base-cache';
import RedisClient, {
  type RedisOptions,
} from 'ioredis';

export interface RedisCacheOptions extends RedisOptions {
  prefix?: string;
}

type RedisConstructorOptions = RedisOptions & {
  replyMapping?: NonNullable<RedisOptions['replyMapping']>;
};

export class RedisCache extends Cache<unknown> {
  readonly prefix: string;
  readonly redis: RedisClient;

  constructor(
    servers: string,
    options?: RedisCacheOptions,
    client?: RedisClient,
  ) {
    super();
    const parts = servers.split(':');
    this.prefix = options?.prefix || '';
    if (options) delete options.prefix;
    this.redis = client ?? (options
      ? new RedisClient(
        Number(parts[1]),
        parts[0] ?? '',
        options as RedisConstructorOptions,
      )
      : new RedisClient(Number(parts[1]), parts[0] ?? ''));
  }

  _getKey(database: string, table: string, key: CacheKey): string {
    let base = `${this.prefix}${database}_${table}`;
    if (typeof key !== 'object') {
      return `${base}:${String(key)}`;
    }
    if (key === null) return base;

    for (const [name, value] of Object.entries(key)) {
      base += `:${name}${String(value)}`;
    }
    return base;
  }

  async deleteData(
    database: string,
    table: string,
    key: CacheKey,
  ): Promise<number> {
    return await this.redis.del(this._getKey(database, table, key));
  }

  async deleteKeys(
    database: string,
    table: string,
    keys: readonly CacheKey[],
  ): Promise<unknown[]> {
    const pipeline = this.redis.pipeline();
    for (const key of keys) {
      pipeline.del(this._getKey(database, table, key));
    }
    const result = await pipeline.exec() as readonly (readonly [Error | null, unknown])[];
    return result.map((entry) => entry[1]);
  }

  async setData(
    database: string,
    table: string,
    key: CacheKey,
    data: unknown,
  ): Promise<'OK' | null> {
    return await this.redis.set(
      this._getKey(database, table, key),
      JSON.stringify(data),
    );
  }

  async getData(
    database: string,
    table: string,
    keys: CacheKey | readonly CacheKey[],
  ): Promise<unknown[]> {
    const normalized = Array.isArray(keys) ? keys : [keys];
    const pipeline = this.redis.pipeline();
    for (const key of normalized) {
      pipeline.get(this._getKey(database, table, key));
    }
    const result = await pipeline.exec() as readonly (readonly [Error | null, unknown])[];
    return result
      .filter((entry) => entry !== null)
      .map((entry) => JSON.parse(entry[1] as string));
  }
}

export function create(
  servers: string,
  options?: RedisCacheOptions,
): RedisCache {
  return new RedisCache(servers, options);
}
