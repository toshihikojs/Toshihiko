# Cache API

A Cache stores complete row objects by database, table, and key. The core owns the structural contract; `@toshihiko/base-cache` provides an event-emitting abstract base class.

## Core contract

```typescript
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
  ): Promise<void | boolean | 'OK' | null>;

  deleteData(
    database: string,
    table: string,
    key: CacheKey,
  ): Promise<void | boolean | number>;

  deleteKeys(
    database: string,
    table: string,
    keys: readonly CacheKey[],
  ): Promise<void | readonly number[]>;
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
  module?: { create(...args: readonly unknown[]): Cache };
  name?: string;
  path?: string;
  [key: string]: unknown;
}
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

new RedisCache(servers, options?, client?)
create(servers, options?)
```

### Options and properties

`RedisCacheOptions` extends `ioredis` options and adds `prefix?: string`.

| Property | Description |
|---|---|
| `prefix` | Prefix captured from options |
| `redis` | `ioredis` client |

`servers` is split as `host:port`. The optional third constructor argument injects an existing client.

Redis keys use `${prefix}${database}_${table}` followed by key material. Data is serialized with `JSON.stringify()` and parsed with `JSON.parse()`.

## Memcached Cache

```typescript
import { MemcachedCache, create } from '@toshihiko/memcached-cache';

new MemcachedCache(servers, options?, client?)
create(servers, options?)
```

`MemcachedCacheOptions` extends the `memcached` client options and adds:

| Option | Description |
|---|---|
| `prefix` | Prepended to generated keys |
| `customizeKey` | Replaces the default key generator |

### Public members

| Member | Description |
|---|---|
| `memcached` | Client instance |
| `servers` | Constructor server location |
| `options` | Constructor options |
| `prefix` | Captured prefix |
| `setCustomizeKeyFunc(func)` | Replaces the key generator after construction |

Client `failure` and `reconnecting` events are re-emitted by the Cache instance. Writes use expiry `0`. Multi-key reads are split to keep Memcached get commands within the package's command-length limit.

## Failure behavior in core reads

`Query.findById()` treats Cache read errors as misses. The MySQL Adapter also falls back to database reads when Cache lookup fails and tolerates Cache population failures. Mutation invalidation belongs to the Adapter.

See [Caching](../caching) for configuration and lifecycle examples.
