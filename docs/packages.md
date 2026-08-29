# Packages

Toshihiko is developed as a monorepo, but every package has its own public API
and release boundary.

| Package | Purpose |
|---|---|
| `toshihiko` | Core Model, Query, Yukari, field types, and contracts. |
| `@toshihiko/mysql-adapter` | MySQL execution through the `mysql2` Promise pool. |
| `@toshihiko/base-adapter` | Base class and utilities for Adapter authors. |
| `@toshihiko/redis-cache` | Redis Cache implementation using `ioredis`. |
| `@toshihiko/memcached-cache` | Memcached Cache implementation. |
| `@toshihiko/base-cache` | Event-emitting Cache base class. |
| `@toshihiko/sql-utils` | SQL name mapping and escaping helpers. |

## `toshihiko`

Install the core with a concrete Adapter:

```bash
npm install toshihiko @toshihiko/mysql-adapter
```

The CommonJS runtime entry exposes `Toshihiko`, `Type`, `Adapter`, and
`Escaper`. Classes such as `Model`, `Query`, and `Yukari`
are primarily exposed as TypeScript types rather than extra runtime globals.

## `@toshihiko/mysql-adapter`

The MySQL Adapter supports MySQL 5.7 and 8.4 in CI. It owns:

- the `mysql2` Promise pool;
- prepared statements and bound values;
- SQL generation for Toshihiko query operators;
- insert readback, including composite and generated keys;
- transactions and connection release;
- query caching and mutation invalidation;
- SQL logging and compatibility helper methods.

```typescript
import { MySQLAdapter } from '@toshihiko/mysql-adapter';

const database = new Toshihiko(MySQLAdapter, {
  database: 'app',
  host: '127.0.0.1',
  password: 'secret',
  port: 3306,
  showSql: false,
  username: 'root',
});
```

The dialect name is equivalent when the package is installed:

```typescript
const database = new Toshihiko('mysql', options);
```

## `@toshihiko/base-adapter`

Adapter authors extend `Adapter` and override the operations supported by their
database. The package also exports `extend()` for recursive option merging.

See [Writing extensions](extensions.md#write-an-adapter).

## Cache packages

Redis and Memcached implement the same core Cache interface but retain their
client-specific constructor options, key generation, batching, and events.

```bash
npm install @toshihiko/redis-cache
# or
npm install @toshihiko/memcached-cache
```

The base Cache package is installed transitively by concrete Cache packages and
is useful directly when implementing a new Cache.

See [Caching](caching.md).

## `@toshihiko/sql-utils`

```typescript
import {
  escape,
  escapeLike,
  sqlNameToColumn,
} from '@toshihiko/sql-utils';
```

- `sqlNameToColumn()` maps logical identifiers inside SQL fragments.
- `escape()` applies Toshihiko string escaping.
- `escapeLike()` escapes `%` and `_` in SQL `LIKE` values.

Use driver-bound values instead of manual escaping whenever the driver API
allows it.

## Dependency direction

| Package | Workspace dependencies |
|---|---|
| `@toshihiko/mysql-adapter` | `@toshihiko/base-adapter`, `toshihiko`, `@toshihiko/sql-utils` |
| `@toshihiko/redis-cache` | `@toshihiko/base-cache` |
| `@toshihiko/memcached-cache` | `@toshihiko/base-cache` |
| `@toshihiko/base-adapter` | `toshihiko` |
| `@toshihiko/base-cache` | `toshihiko` |
| `toshihiko` | `@toshihiko/sql-utils` |

Applications normally depend on the core, one concrete Adapter, and optionally
one concrete Cache. Base packages are extension-authoring tools.
