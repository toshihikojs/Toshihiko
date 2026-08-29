# Toshihiko MySQL Adapter

[![npm](https://img.shields.io/npm/v/@toshihiko/mysql-adapter.svg)](https://www.npmjs.com/package/@toshihiko/mysql-adapter)
[![CI](https://github.com/toshihikojs/Toshihiko/actions/workflows/ci.yml/badge.svg?branch=v2)](https://github.com/toshihikojs/Toshihiko/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/github/toshihikojs/Toshihiko/branch/v2/graph/badge.svg?flag=mysql-adapter)](https://app.codecov.io/github/toshihikojs/Toshihiko/tree/v2)

The Promise-only MySQL Adapter for Toshihiko v2. It uses the `mysql2` Promise Pool and requires Node.js 22 or newer.

## Installation

```bash
npm install toshihiko @toshihiko/mysql-adapter
```

## Usage

Install the package and use the `mysql` dialect name:

```typescript
import { Toshihiko, Type } from 'toshihiko';

const toshihiko = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  password: 'secret',
  username: 'root',
});

const User = toshihiko.define('users', [
  { name: 'id', column: 'user_id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
]);

const users = await User.where({ id: { $gte: 1 } }).find(true);
```

`find`, `count`, writes, raw execution, and transaction methods all return native Promises.

## Configuration

`MySQLAdapterOptions` extends `mysql2` `PoolOptions`. The Adapter handles these Toshihiko-specific fields and passes the remaining driver options to `mysql2.createPool()`.

| Field | Type | Default | Description |
|---|---|---:|---|
| `database` | `string` | `'toshihiko'` | Database name and Cache namespace |
| `host` | `string` | `'localhost'` | MySQL host name or IP address |
| `port` | `number` | `3306` | MySQL port |
| `user` | `string` | `''` | MySQL user name |
| `username` | `string` | — | Compatibility spelling for `user`; wins when both are present |
| `password` | `string` | `''` | MySQL password |
| `pool` | `MySQLPool` | — | Reuses an existing Promise Pool instead of creating one |
| `showSql` | `false \| true \| ((sql: string) => void)` | `false` | Enables console logging or calls a custom SQL logger |
| `cache` | `Cache \| CacheOptions` | — | Existing Cache instance or module configuration inherited by Models |
| `package` | `string` | — | Compatibility field; the runtime driver remains `mysql2` |

Driver fields such as `connectionLimit`, `charset`, `ssl`, and `connectTimeout` are also accepted. See the [`mysql2` PoolOptions documentation](https://sidorares.github.io/node-mysql2/docs/examples/connections/create-pool).

The Adapter constructor and a prebuilt Adapter instance can also be passed directly when an application needs explicit dependency injection:

```typescript
import { MySQLAdapter } from '@toshihiko/mysql-adapter';

const toshihiko = new Toshihiko(MySQLAdapter, {
  database: 'app',
});
```

## Cache

Attach a cache to Toshihiko or to one model. Models inherit the Toshihiko-level cache unless their own `cache` option replaces or disables it.

```typescript
import { MemcachedCache } from '@toshihiko/memcached-cache';

const cache = new MemcachedCache('127.0.0.1:11211');
const toshihiko = new Toshihiko('mysql', {
  cache,
  database: 'app',
});

const UncachedAudit = toshihiko.define('audit', auditSchema, { cache: false });
```

MySQL reads cached rows and fills misses without changing their input order. Updates and deletes invalidate matching primary-key entries before changing the database. Pass `{ noCache: true }` to `find` to bypass cache reads for one query.

## Raw SQL

`execute` accepts an optional transaction connection before the SQL string. All forms are Promise-only.

```typescript
await toshihiko.execute(
  'UPDATE `users` SET `name` = ? WHERE `user_id` = ?',
  ['Alice', 1],
);

const connection = await User.beginTransaction();
try {
  await User.conn(connection).execute(
    'DELETE FROM `users` WHERE `user_id` = ?',
    [1],
  );
  await User.commit(connection);
} catch (error) {
  await User.rollback(connection);
  throw error;
}
```

Committed or rolled-back connections are always released to the pool, including error paths.

## SQL Logging

Set `showSql` to a function to receive formatted SQL statements:

```typescript
const adapter = new MySQLAdapter({
  database: 'app',
  showSql: (sql) => console.log(sql),
});
```

The Adapter also emits a `sql` event for every statement and a `log` event when the pool creates a connection. Passwords and injected pool objects are not retained in the public `options` property.

## SQL helpers

The SQL builder provides `makeWhere`, `makeFind`, `$eq`, `$neq`, `$in`, `$between`, `$and`, and `$or`. Raw update expressions such as `{{score + 1}}` are also supported, but they must contain trusted application-owned SQL rather than user input.

Real MySQL 5.7 and MySQL 8.4 integration tests run in GitHub Actions. The local test suite uses a Promise Pool contract double and does not require Docker.

## License

MIT
