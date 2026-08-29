# Cache API

本页主要面向 Cache 包与 Adapter 开发者。Cache 按数据库、表和键存放完整数据行。

## 核心契约

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

`CacheKey` 可以是对象或原始值；对象用于联合键。能够表示 miss 的实现应使用 `null`，并保持输入顺序。

## 配置

```typescript
type DataValue =
  | object
  | string
  | number
  | bigint
  | boolean
  | symbol
  | null
  | undefined;

interface CacheModule {
  create(...args: DataValue[]): Cache;
}

interface CacheOptions {
  readonly [key: string]: DataValue;
  readonly module?: CacheModule;
  readonly name?: string;
  readonly path?: string;
}

type CacheSource = Cache | CacheOptions;
```

Toshihiko 与 Model 可接收现有 Cache，或接收包含 `module`、`path`、`name` 的模块式配置。解析顺序为 `module`、`path`、`name`；`name: 'redis'` 会加载 `@toshihiko/redis-cache`。

Model 的 `cache: false` 或 `cache: null` 会关闭继承；省略时继承数据库级 Cache。

## `@toshihiko/base-cache`

`Cache` 基础类继承 Node.js `EventEmitter`，把四个操作保留为抽象契约，不规定键格式、序列化、分批方式、过期时间或客户端创建方式。

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

`RedisCacheOptions` 扩展 `ioredis` 配置并增加 `prefix`。公开属性类型为 `readonly prefix: string` 与 `readonly redis: RedisClient`。各操作的具体返回类型为：

```typescript
deleteData(database: string, table: string, key: CacheKey): Promise<number>
deleteKeys(database: string, table: string, keys: readonly CacheKey[]): Promise<number[]>
setData<Value extends object>(database: string, table: string, key: CacheKey, data: Value): Promise<'OK' | null>
getData<Value extends object>(database: string, table: string, keys: CacheKey | readonly CacheKey[]): Promise<(Value | null)[]>
```

数据通过 JSON 序列化；可注入现有客户端进行测试或统一连接管理。

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

配置增加 `prefix` 与 `customizeKey`。公开属性为：

```typescript
readonly memcached: MemcachedClient
readonly options: MemcachedCacheOptions | undefined
readonly prefix: string
readonly servers: MemcachedClient.Location
```

Cache 操作返回 `Promise<boolean>`、`Promise<void>`、`Promise<boolean>` 与 `Promise<(Value | null)[]>`，顺序分别对应 `deleteData()`、`deleteKeys()`、`setData()` 与 `getData()`。连接的 `failure` 与 `reconnecting` 事件会重新触发。

键生成细节属于实现内部。调用者通过四个 Cache 操作观察结果，不依赖内部生成函数。

## 失败行为

`Query.findById()` 会把 Cache 读取错误当作 miss。MySQL Adapter 也会在 Cache 查询或回填失败时回退到数据库；写入前的缓存失效由 Adapter 负责。
