# Caching

Toshihiko can attach a Cache globally or to one Model. The core defines the
Cache contract; concrete Adapters decide where reads, fills, and invalidation
participate in database operations.

## Configure a Cache

```typescript
import { MemcachedCache } from '@toshihiko/memcached-cache';
import { Toshihiko } from 'toshihiko';

const cache = new MemcachedCache('127.0.0.1:11211', {
  prefix: 'app:',
});

const database = new Toshihiko('mysql', {
  cache,
  database: 'app',
});
```

Every Model inherits `database.cache` unless its options change the choice:

```typescript
const CachedUser = database.define('users', userSchema);
const SeparateUser = database.define('users', userSchema, { cache: otherCache });
const UncachedAudit = database.define('audit', auditSchema, { cache: false });
```

`null` also disables the inherited Cache for that Model.

## Cache contract

A Cache implements four asynchronous operations:

| Method | Purpose |
|---|---|
| `getData(database, table, keys)` | Read one or more cached rows. |
| `setData(database, table, key, data)` | Store one row. |
| `deleteData(database, table, key)` | Remove one row key. |
| `deleteKeys(database, table, keys)` | Remove several row keys. |

Batch reads preserve input positions with `null` cache misses. This lets the
Adapter combine hits and database results without losing key order.

## Read path

`findById()` first asks the Model Cache for its primary-key condition. A hit is
hydrated into a queried Yukari; a miss falls back to the database backend.

The MySQL Adapter also supports cached query reads. It fills missing rows and
preserves selected fields when it falls back to MySQL.

```typescript
const user = await User.findById(1);
const freshUsers = await User.where({ active: true }).find({ noCache: true });
```

`noCache` bypasses cache reads for that query. It does not detach the Model
Cache permanently.

## Invalidation

The MySQL Adapter invalidates related primary-key entries before updates and
deletes. Yukari writes use the original row locator, so changing a primary-key
property does not lose the old cache key.

Cache errors on the `findById()` lookup path are treated as misses and database
access continues. Database and mutation failures still propagate normally.

## Redis

```typescript
import { RedisCache } from '@toshihiko/redis-cache';

const cache = new RedisCache('127.0.0.1:6379', {
  prefix: 'app:',
});
```

The Redis package uses `ioredis`, supports batched operations, forwards client
events, and keeps input positions with `null` misses.

## Memcached

```typescript
import { MemcachedCache } from '@toshihiko/memcached-cache';

const cache = new MemcachedCache('127.0.0.1:11211', {
  prefix: 'app:',
});
```

Use `setCustomizeKeyFunc()` when a deployment requires a custom key layout:

```typescript
cache.setCustomizeKeyFunc((database, table, key) => (
  `${database}:${table}:${String(key)}`
));
```

## Module configuration

JavaScript applications can pass a module-style cache source with `name`,
`path`, or `module`. TypeScript applications should usually construct a
Cache instance directly because constructor options stay visible and typed.

## Related pages

- [Cache packages](packages.md#cache-packages)
- [Writing a Cache](extensions.md#write-a-cache)
- [Model cache options](model/definition.md#model-options-and-cache-inheritance)
