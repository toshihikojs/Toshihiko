# Cache API

A Cache stores complete row objects by database, table, and key. The core owns the structural contract; `@toshihiko/base-cache` provides an event-emitting abstract base class.

## Core contract

```typescript
type CacheDeleteResult = void | boolean | number;
type CacheDeleteKeysResult = void | readonly number[];
type CacheSetResult = void | boolean | 'OK' | null;

interface Cache {
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
}
```

`getData()` returns results in the requested order when the implementation can represent misses and uses `null` for a represented miss. Concrete legacy-compatible packages may return an empty array when a single key is absent.

## `CacheKey`

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
```

Objects represent composite keys. `null` and `undefined` may be interpreted as a table-level key by a concrete Cache.

## Cache configuration

`Toshihiko` and Model options accept an existing Cache or module-style options.

```typescript
interface CacheOptions {
  readonly [key: string]: unknown;
  readonly module?: CacheModule;
  readonly name?: string;
  readonly path?: string;
}

interface CacheModule {
  create(...args: readonly unknown[]): Cache;
}

type CacheSource = Cache | CacheOptions;
```

Resolution order is `module`, `path`, then `name`. A name such as `'redis'` loads `@toshihiko/redis-cache`. Toshihiko inspects the selected module's `create()` parameter names and supplies matching option properties.

```typescript
const database = new Toshihiko('mysql', {
  ...mysqlOptions,
  cache: {
    name: 'redis',
    servers: '127.0.0.1:6379',
    options: { prefix: 'app:' },
  },
});
```

At Model level, `cache: false` and `cache: null` disable inheritance. An omitted option inherits the database Cache.

## Base `Cache` class

```typescript
import { Cache } from '@toshihiko/base-cache';
```

The class extends Node.js `EventEmitter` and leaves all four Cache operations abstract. It does not prescribe key format, serialization, batching, expiry, or client construction.

## Redis Cache

```typescript
import { RedisCache, create } from '@toshihiko/redis-cache';

new RedisCache(servers: string, options?: RedisCacheOptions, client?: RedisClient)
create(servers: string, options?: RedisCacheOptions): RedisCache
```

### Options and properties

`RedisCacheOptions` extends `ioredis` options and adds `prefix?: string`.

| Property | Type |
|---|---|
| `prefix` | `string` |
| `redis` | `RedisClient` |

`servers` is split as `host:port`. The optional third constructor argument injects an existing client.

Redis keys use `${prefix}${database}_${table}` followed by key material. Data is serialized with `JSON.stringify()` and parsed with `JSON.parse()`.

## Memcached Cache

```typescript
import { MemcachedCache, create } from '@toshihiko/memcached-cache';

new MemcachedCache(servers: MemcachedClient.Location, options?: MemcachedCacheOptions, client?: MemcachedClient)
create(servers: MemcachedClient.Location, options?: MemcachedCacheOptions): MemcachedCache
```

`MemcachedCacheOptions` extends the `memcached` client options and adds:

| Option | Type |
|---|---|
| `prefix` | `string \| undefined` |
| `customizeKey` | `CustomizeKey \| undefined` |

### Public members

| Member | Type |
|---|---|
| `memcached` | `MemcachedClient` |
| `servers` | `MemcachedClient.Location` |
| `options` | `MemcachedCacheOptions \| undefined` |
| `prefix` | `string` |
| `setCustomizeKeyFunc` | `(func: CustomizeKey) => void` |

Client `failure` and `reconnecting` events are re-emitted by the Cache instance. Writes use expiry `0`. Multi-key reads are split to keep Memcached get commands within the package's command-length limit.

## Failure behavior in core reads

`Query.findById()` treats Cache read errors as misses. The MySQL Adapter also falls back to database reads when Cache lookup fails and tolerates Cache population failures. Mutation invalidation belongs to the Adapter.

See [Caching](../caching) for configuration and lifecycle examples.
