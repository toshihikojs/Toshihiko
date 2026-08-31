import {
  Cache,
  type CacheKey,
} from '@toshihiko/base-cache';
import RedisClient, {
  type RedisOptions,
} from 'ioredis';

/**
 * ioredis options plus the prefix added to every generated Cache key.
 * @zh ioredis 选项，以及添加到每个生成 Cache key 前的前缀。
 * @ja ioredis のオプションと、生成するすべての Cache キーに付加するプレフィックスです。
 */
export interface RedisCacheOptions extends RedisOptions {
  /**
   * Text prepended to the database and table namespaces.
   * @zh 添加到数据库和表命名空间前的文本。
   * @ja データベースおよびテーブルの名前空間の先頭に付加する文字列です。
   */
  prefix?: string;
}

type RedisConstructorOptions = RedisOptions & {
  replyMapping?: NonNullable<RedisOptions['replyMapping']>;
};

/**
 * Redis-backed Cache implementation using ioredis pipelines for batch reads
 * and invalidation.
 * @zh 基于 Redis 的 Cache 实现，使用 ioredis pipeline 批量读取和失效缓存。
 * @ja Redis をバックエンドに使用する Cache 実装です。一括読み取りと無効化には ioredis の `pipeline` を使用します。
 */
export class RedisCache extends Cache {
  /**
   * Prefix prepended to generated Redis keys.
   * @zh 添加到生成的 Redis key 前的前缀。
   * @ja 生成する Redis キーの先頭に付加するプレフィックスです。
   */
  readonly prefix: string;
  /**
   * Underlying ioredis client.
   * @zh 底层 ioredis 客户端。
   * @ja 基盤となる ioredis クライアントです。
   */
  readonly redis: RedisClient;

  /**
   * Creates a Redis Cache.
   * @zh 创建 Redis Cache。
   * @ja Redis Cache を作成します。
   * @param servers - Redis address in `host:port` form.
   * @zh servers - 以下格式的 Redis 地址：`host:port` 形式。
   * @ja servers - `host:port` 形式の Redis アドレスです。
   * @param options - ioredis options and optional Cache-key prefix.
   * @zh options - ioredis 选项和可选 Cache key 前缀。
   * @ja options - ioredis のオプションと、任意の Cache キープレフィックスです。
   * @param client - Existing ioredis client, mainly for integration and tests.
   * @zh client - 现有 ioredis 客户端，主要用于集成和测试。
   * @ja client - 既存の ioredis クライアントです。主にインテグレーションとテストで使用します。
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

/**
 * Factory used by Toshihiko's module-style Cache configuration.
 * @zh Toshihiko 模块式 Cache 配置使用的工厂函数。
 * @ja Toshihiko のモジュール形式の Cache 設定で使用するファクトリーです。
 */
export function create(
  servers: string,
  options?: RedisCacheOptions,
): RedisCache {
  return new RedisCache(servers, options);
}
