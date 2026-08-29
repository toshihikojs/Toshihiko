# Writing extensions

Toshihiko exposes typed contracts for database Adapters and Caches. Use the
base packages when building reusable extensions; implement the core interfaces
directly for small application-local integrations.

## Write an Adapter

Install the core and base Adapter:

```bash
npm install toshihiko @toshihiko/base-adapter
```

The base class declares database operations and accepts either
`(toshihiko, options)` or standalone `(options)` construction. Unsupported
operations reject until the concrete Adapter overrides them.

```typescript
import {
  Adapter,
  type AdapterFindOptions,
  type AdapterQuery,
  type AdapterRow,
} from '@toshihiko/base-adapter';

interface ExampleOptions {
  readonly database: string;
}

class ExampleAdapter extends Adapter<ExampleOptions> {
  override async find(
    query: AdapterQuery,
    options?: AdapterFindOptions,
  ): Promise<readonly AdapterRow[] | AdapterRow | null> {
    const rows = await runDatabaseQuery(query);
    return options?.single ? rows[0] ?? null : rows;
  }

  override async count(query: AdapterQuery): Promise<number> {
    return await runDatabaseCount(query);
  }

  override getDBName(): string {
    return this.options.database;
  }
}
```

Inject the constructor into Toshihiko:

```typescript
const database = new Toshihiko(ExampleAdapter, {
  database: 'app',
});
```

Toshihiko calls Adapter constructors with `(toshihiko, options)`. The standalone
`new ExampleAdapter(options)` form remains useful in Adapter-local tests.

### Adapter operations

Override the operations the database supports:

| Method | Responsibility |
|---|---|
| `find(query, options)` | Read one or many storage rows. |
| `count(query)` | Return the row count. |
| `insert(model, connection, data)` | Insert and optionally return a readback row. |
| `update(model, connection, primaryKey, data)` | Update one queried Yukari. |
| `updateByQuery(query)` | Update rows represented by a Query. |
| `deleteByQuery(query)` | Delete rows represented by a Query. |
| `execute(...)` | Run database-specific commands. |
| `beginTransaction()` | Create a typed transaction connection. |
| `commit(connection)` | Commit and release it. |
| `rollback(connection)` | Roll back and release it. |
| `getDBName()` | Expose the database name used by models and caches. |

Adapter generics can specialize Model, Connection, Field, Value, Query, and
operation results. The core validates that its Model and Query types satisfy
the declared Adapter contracts when `define()` is called.

### Option merging

`@toshihiko/base-adapter` exports `extend(defaults, options)`. It deep-clones
inputs and gives explicit options precedence over defaults.

```typescript
const options = extend(
  { host: '127.0.0.1', pool: { size: 10 } },
  { pool: { size: 20 } },
);
```

## Write a Cache

Install the core and base Cache:

```bash
npm install toshihiko @toshihiko/base-cache
```

```typescript
import {
  Cache,
  type CacheKey,
} from '@toshihiko/base-cache';

class MemoryCache extends Cache {
  async getData<Value extends object>(
    database: string,
    table: string,
    keys: CacheKey | readonly CacheKey[],
  ): Promise<(Value | null)[]> {
    return readValues<Value>(database, table, keys);
  }

  async setData<Value extends object>(
    database: string,
    table: string,
    key: CacheKey,
    data: Value,
  ): Promise<void> {
    writeValue(database, table, key, data);
  }

  async deleteData(
    database: string,
    table: string,
    key: CacheKey,
  ): Promise<void> {
    deleteValue(database, table, key);
  }

  async deleteKeys(
    database: string,
    table: string,
    keys: readonly CacheKey[],
  ): Promise<void> {
    for (const key of keys) deleteValue(database, table, key);
  }
}
```

The base class supplies EventEmitter behavior. It does not prescribe key
format, serialization, batching, client construction, or expiry. Those choices
belong to the concrete Cache.

`getData()` must preserve the requested key order and use `null` for misses.
This is part of the Adapter/Cache boundary, not a Redis-specific detail.

## Test an extension

An extension should have three layers of tests:

1. Type tests for constructor options, connection types, and result types.
2. Unit tests for success, empty results, unusual driver values, and failures.
3. Service-backed tests against the database or cache versions it claims to support.

Also compile a consumer through the built package entry point. Source-only
tests do not prove that exported declarations and CommonJS files are correct.

## Related pages

- [Core concepts](concepts.md)
- [Caching](caching.md)
- [Development and testing](testing.md)
