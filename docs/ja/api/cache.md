# Cache API

このページは主に Cache パッケージと Adapter の開発者向けです。Cache はデータベース、テーブル、キーごとに完全な行 object を保存します。

## コア契約

```typescript
type CacheKey =
  | object
  | string
  | number
  | bigint
  | boolean
  | symbol
  | null
  | undefined;

type CacheDeleteResult = void | boolean | number;
type CacheDeleteKeysResult = void | readonly number[];
type CacheSetResult = void | boolean | 'OK' | null;

interface Cache {
  getData<Value extends object>(database: string, table: string,
    keys: CacheKey | readonly CacheKey[]): Promise<(Value | null)[]>;
  setData<Value extends object>(database: string, table: string,
    key: CacheKey, data: Value): Promise<CacheSetResult>;
  deleteData(database: string, table: string,
    key: CacheKey): Promise<CacheDeleteResult>;
  deleteKeys(database: string, table: string,
    keys: readonly CacheKey[]): Promise<CacheDeleteKeysResult>;
}
```

`CacheKey` は object または primitive です。object は複合キーを表します。miss を表現できる実装は `null` を使い、入力順序を保持します。

## 設定

```typescript
interface CacheModule {
  create(...args: readonly unknown[]): Cache;
}

interface CacheOptions {
  readonly [key: string]: unknown;
  readonly module?: CacheModule;
  readonly name?: string;
  readonly path?: string;
}

type CacheSource = Cache | CacheOptions;
```

Toshihiko と Model は既存 Cache または `module`、`path`、`name` を含む module 形式の設定を受け付けます。解決順は `module`、`path`、`name` です。`name: 'redis'` は `@toshihiko/redis-cache` を読み込みます。

Model の `cache: false` または `cache: null` は継承を無効にします。省略するとデータベース Cache を継承します。

## `@toshihiko/base-cache`

`Cache` 基底クラスは Node.js `EventEmitter` を継承し、4 操作を abstract contract として残します。キー形式、シリアライズ、batch、期限、client 作成方法は規定しません。

## Redis Cache

```typescript
interface RedisCacheOptions extends RedisOptions {
  prefix?: string;
}

new RedisCache(
  servers: string,
  options?: RedisCacheOptions,
  client?: RedisClient,
)
create(servers: string, options?: RedisCacheOptions): RedisCache
```

`RedisCacheOptions` は `ioredis` options に `prefix` を追加します。公開プロパティは `readonly prefix: string` と `readonly redis: RedisClient` です。

```typescript
deleteData(database: string, table: string, key: CacheKey): Promise<number>
deleteKeys(database: string, table: string, keys: readonly CacheKey[]): Promise<number[]>
setData<Value extends object>(database: string, table: string, key: CacheKey, data: Value): Promise<'OK' | null>
getData<Value extends object>(database: string, table: string, keys: CacheKey | readonly CacheKey[]): Promise<(Value | null)[]>
```

データは JSON で保存され、既存 client を注入できます。

## Memcached Cache

```typescript
type CustomizeKey = (
  this: MemcachedCache,
  database: string,
  table: string,
  key: CacheKey,
) => string;

interface MemcachedCacheOptions extends MemcachedClient.options {
  prefix?: string;
  customizeKey?: CustomizeKey;
}

new MemcachedCache(
  servers: MemcachedClient.Location,
  options?: MemcachedCacheOptions,
  client?: MemcachedClient,
)
create(
  servers: MemcachedClient.Location,
  options?: MemcachedCacheOptions,
): MemcachedCache
setCustomizeKeyFunc(func: CustomizeKey): void
```

options は `prefix` と `customizeKey` を追加します。公開プロパティは次の型です。

```typescript
readonly memcached: MemcachedClient
readonly options: MemcachedCacheOptions | undefined
readonly prefix: string
readonly servers: MemcachedClient.Location
```

`deleteData()`、`deleteKeys()`、`setData()`、`getData()` の戻り値は順に `Promise<boolean>`、`Promise<void>`、`Promise<boolean>`、`Promise<(Value | null)[]>` です。`failure` と `reconnecting` event は Cache から再送されます。

キー生成の詳細は実装内部です。利用者は 4 つの Cache 操作の結果だけを観察します。

## 失敗時の動作

`Query.findById()` は Cache 読み取りエラーを miss として扱います。MySQL Adapter も Cache の lookup または population が失敗した場合にデータベースへ fallback します。mutation 前の invalidation は Adapter が担当します。
