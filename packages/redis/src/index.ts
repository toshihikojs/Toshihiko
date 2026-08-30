import {
  Cache,
  type CacheKey,
} from '@toshihiko/base-cache';
import RedisClient, {
  type RedisOptions,
} from 'ioredis';

/** ioredis options plus the prefix added to every generated Cache key. */
export interface RedisCacheOptions extends RedisOptions {
  /** Text prepended to the database and table namespaces. */
  prefix?: string;
}

type RedisConstructorOptions = RedisOptions & {
  replyMapping?: NonNullable<RedisOptions['replyMapping']>;
};

/**
 * Redis-backed Cache implementation using ioredis pipelines for batch reads
 * and invalidation.
 */
export class RedisCache extends Cache {
  /** Prefix prepended to generated Redis keys. */
  readonly prefix: string;
  /** Underlying ioredis client. */
  readonly redis: RedisClient;

  /**
   * Creates a Redis Cache.
   *
   * @param servers - Redis address in `host:port` form.
   * @param options - ioredis options and optional Cache-key prefix.
   * @param client - Existing ioredis client, mainly for integration and tests.
   */
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
        parts[0]!,
        options as RedisConstructorOptions,
      )
      : new RedisClient(Number(parts[1]), parts[0]!));
  }

  #getKey(database: string, table: string, key: CacheKey): string {
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
    return await this.redis.del(this.#getKey(database, table, key));
  }

  async deleteKeys(
    database: string,
    table: string,
    keys: readonly CacheKey[],
  ): Promise<number[]> {
    const pipeline = this.redis.pipeline();
    for (const key of keys) {
      pipeline.del(this.#getKey(database, table, key));
    }
    const result = await pipeline.exec() as readonly (readonly [Error | null, number])[] | null;
    return result?.map((entry) => entry[1]) ?? [];
  }

  async setData<Value extends object>(
    database: string,
    table: string,
    key: CacheKey,
    data: Value,
  ): Promise<'OK' | null> {
    return await this.redis.set(
      this.#getKey(database, table, key),
      JSON.stringify(data),
    );
  }

  async getData<Value extends object>(
    database: string,
    table: string,
    keys: CacheKey | readonly CacheKey[],
  ): Promise<(Value | null)[]> {
    const normalized = Array.isArray(keys) ? keys : [keys];
    const pipeline = this.redis.pipeline();
    for (const key of normalized) {
      pipeline.get(this.#getKey(database, table, key));
    }
    const result = await pipeline.exec() as readonly (readonly [Error | null, string | null])[] | null;
    return result?.map((entry) => entry[1] === null
      ? null
      : JSON.parse(entry[1]) as Value) ?? [];
  }
}

/** Factory used by Toshihiko's module-style Cache configuration. */
export function create(
  servers: string,
  options?: RedisCacheOptions,
): RedisCache {
  return new RedisCache(servers, options);
}
