import {
  Cache,
  type CacheKey,
} from '@toshihiko/base-cache';
import MemcachedClient from 'memcached';

const memcachedCommandMaxLength = 250;

/**
 * Custom Cache-key generator bound to the MemcachedCache instance.
 * @zh 绑定到 MemcachedCache 实例的自定义 Cache key 生成器。
 * @ja MemcachedCache インスタンスにバインドされた、カスタム Cache キー生成関数です。
 */
export type CustomizeKey = (
  this: MemcachedCache,
  database: string,
  table: string,
  key: CacheKey,
) => string;

/**
 * Memcached client options plus Toshihiko Cache-key customization.
 * @zh Memcached 客户端选项及 Toshihiko Cache key 自定义。
 * @ja Memcached クライアントのオプションと、Toshihiko の Cache キーカスタマイズです。
 */
export interface MemcachedCacheOptions extends MemcachedClient.options {
  /**
   * Text prepended to generated Memcached keys.
   * @zh 添加到生成的 Memcached key 前的文本。
   * @ja 生成する Memcached キーの先頭に付加する文字列です。
   */
  prefix?: string;
  /**
   * Replaces the default composite-key generator.
   * @zh 替换默认的复合 key 生成器。
   * @ja 既定の複合キー生成関数を置き換えます。
   */
  customizeKey?: CustomizeKey;
}

/**
 * Memcached-backed Cache implementation.
 *
 * Batch reads are split to keep each Memcached `get` command within the
 * protocol's 250-character key command limit. Batch deletion uses at most ten
 * concurrent workers.
 * @zh 基于 Memcached 的 Cache 实现。
 *
 * 批量读取会拆分，以确保每条 Memcached `get` 命令，且不超过协议规定的 250 字符 key 命令上限。批量删除最多使用十个并发 worker。
 * @ja Memcached をバックエンドに使用する Cache 実装です。
 *
 * 一括読み取りは、各 Memcached `get` コマンドがプロトコルで定められた 250 文字のキーコマンド上限に収まるよう分割されます。一括削除では、同時に最大 10 個の worker を使用します。
 */
export class MemcachedCache extends Cache {
  #keyGenerator: CustomizeKey;
  /**
   * Underlying `memcached` client.
   * @zh 底层 `memcached` 客户端。
   * @ja 基盤となる `memcached` クライアントです。
   */
  readonly memcached: MemcachedClient;
  /**
   * Client and key-generation options supplied at construction.
   * @zh 构造时传入的客户端和 key 生成选项。
   * @ja 構築時に渡されたクライアントおよびキー生成のオプションです。
   */
  readonly options: MemcachedCacheOptions | undefined;
  /**
   * Prefix prepended to generated keys.
   * @zh 添加到生成 key 前的前缀。
   * @ja 生成するキーの先頭に付加するプレフィックスです。
   */
  readonly prefix: string;
  /**
   * Memcached server location passed to the client.
   * @zh 传给客户端的 Memcached 服务地址。
   * @ja クライアントへ渡す Memcached サーバーの接続先です。
   */
  readonly servers: MemcachedClient.Location;

  /**
   * Creates a Memcached Cache.
   * @zh 创建 Memcached Cache。
   * @ja Memcached Cache を作成します。
   * @param servers - Location accepted by the `memcached` client.
   * @zh servers - 以下客户端接受的位置：`memcached` 客户端。
   * @ja servers - `memcached` クライアントが受け付ける接続先です。
   * @param options - Client options and Cache-key customization.
   * @zh options - 客户端选项和 Cache key 自定义。
   * @ja options - クライアントのオプションと Cache キーのカスタマイズです。
   * @param client - Existing client, mainly for integration and tests.
   * @zh client - 现有客户端，主要用于集成和测试。
   * @ja client - 既存のクライアントです。主にインテグレーションとテストで使用します。
   */
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
    this.#keyGenerator = options?.customizeKey?.bind(this)
      ?? this.#defaultKey.bind(this);

    this.memcached.on('failure', (details) => this.emit('failure', details));
    this.memcached.on('reconnecting', (details) => this.emit('reconnecting', details));

  }

  /**
   * Replaces the Cache-key generator and binds it to this instance.
   * @zh 替换 Cache key 生成器，并把它绑定到当前实例。
   * @ja Cache キー生成関数を置き換え、このインスタンスにバインドします。
   */
  setCustomizeKeyFunc(func: CustomizeKey): void {
    this.#keyGenerator = func.bind(this);
  }

  #defaultKey(database: string, table: string, key: CacheKey): string {
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

  #getKeys(
    database: string,
    table: string,
    keys: readonly CacheKey[],
  ): string[] {
    return keys.map((key) => this.#keyGenerator(database, table, key));
  }

  async deleteData(
    database: string,
    table: string,
    key: CacheKey,
  ): Promise<boolean> {
    const cacheKey = this.#keyGenerator(database, table, key);
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

  async setData<Value extends object>(
    database: string,
    table: string,
    key: CacheKey,
    data: Value,
  ): Promise<boolean> {
    const cacheKey = this.#keyGenerator(database, table, key);
    return await new Promise<boolean>((resolve, reject) => {
      this.memcached.set(cacheKey, data, 0, (error) => {
        if (error) reject(error);
        else resolve(true);
      });
    });
  }

  async getData<Value extends object>(
    database: string,
    table: string,
    keys: CacheKey | readonly CacheKey[],
  ): Promise<(Value | null)[]> {
    const normalized = Array.isArray(keys) ? keys : [keys];
    const cacheKeys = this.#getKeys(database, table, normalized);
    if (cacheKeys.length === 0) return [];
    if (cacheKeys.length === 1) {
      const data = await this.get<Value>(cacheKeys[0]!);
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

    const result: Value[] = [];
    for (const group of groups) {
      result.push(...await this.getMany<Value>(group));
    }
    return result;
  }

  private async get<Value extends object>(key: string): Promise<Value | undefined> {
    return await new Promise<Value | undefined>((resolve, reject) => {
      this.memcached.get(key, (error, data) => {
        if (error) reject(error);
        else resolve(data);
      });
    });
  }

  private async getMany<Value extends object>(keys: readonly string[]): Promise<Value[]> {
    return await new Promise<Value[]>((resolve, reject) => {
      this.memcached.getMulti([...keys], (error, data) => {
        if (error) {
          reject(error);
          return;
        }
        const result: Value[] = [];
        for (const key of keys) {
          if (data[key]) result.push(data[key]);
        }
        resolve(result);
      });
    });
  }
}

/**
 * Factory used by Toshihiko's module-style Cache configuration.
 * @zh Toshihiko 模块式 Cache 配置使用的工厂函数。
 * @ja Toshihiko のモジュール形式の Cache 設定で使用するファクトリーです。
 */
export function create(
  servers: MemcachedClient.Location,
  options?: MemcachedCacheOptions,
): MemcachedCache {
  return new MemcachedCache(servers, options);
}
