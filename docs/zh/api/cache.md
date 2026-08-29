# Cache API

本页主要面向 Cache 包与 Adapter 开发者。Cache 按数据库、表和键存放完整数据行。

## 核心契约

```typescript
interface Cache {
  getData<Value extends object>(database: string, table: string,
    keys: CacheKey | readonly CacheKey[]): Promise<(Value | null)[]>;
  setData<Value extends object>(database: string, table: string,
    key: CacheKey, data: Value): Promise<void | boolean | 'OK' | null>;
  deleteData(database: string, table: string,
    key: CacheKey): Promise<void | boolean | number>;
  deleteKeys(database: string, table: string,
    keys: readonly CacheKey[]): Promise<void | readonly number[]>;
}
```

`CacheKey` 可以是对象或原始值；对象用于联合键。能够表示 miss 的实现应使用 `null`，并保持输入顺序。

## 配置

Toshihiko 与 Model 可接收现有 Cache，或接收包含 `module`、`path`、`name` 的模块式配置。解析顺序为 `module`、`path`、`name`；`name: 'redis'` 会加载 `@toshihiko/redis-cache`。

Model 的 `cache: false` 或 `cache: null` 会关闭继承；省略时继承数据库级 Cache。

## `@toshihiko/base-cache`

`Cache` 基础类继承 Node.js `EventEmitter`，把四个操作保留为抽象契约，不规定键格式、序列化、分批方式、过期时间或客户端创建方式。

## Redis Cache

```typescript
new RedisCache(servers, options?, client?)
create(servers, options?)
```

`RedisCacheOptions` 扩展 `ioredis` 配置并增加 `prefix`。公开属性为 `prefix` 与 `redis`。数据通过 JSON 序列化；可注入现有客户端进行测试或统一连接管理。

## Memcached Cache

```typescript
new MemcachedCache(servers, options?, client?)
create(servers, options?)
```

配置增加 `prefix` 与 `customizeKey`。公开成员包括 `memcached`、`servers`、`options`、`prefix` 和 `setCustomizeKeyFunc()`。连接的 `failure` 与 `reconnecting` 事件会重新触发。

键生成细节属于实现内部。调用者通过四个 Cache 操作观察结果，不依赖内部生成函数。

## 失败行为

`Query.findById()` 会把 Cache 读取错误当作 miss。MySQL Adapter 也会在 Cache 查询或回填失败时回退到数据库；写入前的缓存失效由 Adapter 负责。
