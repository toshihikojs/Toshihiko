# Toshihiko MySQL Adapter

[![CI](https://github.com/toshihikojs/mysql-adapter/actions/workflows/ci.yml/badge.svg?branch=v2)](https://github.com/toshihikojs/mysql-adapter/actions/workflows/ci.yml)

The Promise-only MySQL Adapter for Toshihiko v2. It uses the `mysql2` Promise Pool and requires Node.js 22 or newer.

## Installation

```bash
npm install toshihiko @toshihiko/mysql-adapter
```

## Usage

Install the package and use the original `mysql` dialect name. The `define` API remains unchanged.

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

MySQL reads cached rows and fills misses with the same behavior as Toshihiko v1. Updates and deletes invalidate matching primary-key entries before changing the database. Pass `{ noCache: true }` to `find` to bypass cache reads for one query.

## Raw SQL

`execute` retains the v1 argument order, with an optional connection before the SQL string at the Adapter layer. All forms are Promise-only.

```typescript
await toshihiko.adapter.execute(
  'UPDATE `users` SET `name` = ? WHERE `user_id` = ?',
  ['Alice', 1],
);

const adapter = toshihiko.getAdapter();
const connection = await adapter.beginTransaction();
try {
  await adapter.execute(connection, 'DELETE FROM `users` WHERE `user_id` = ?', [1]);
} catch (error) {
  await adapter.rollback(connection);
  throw error;
}
await adapter.commit(connection);
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

## Compatibility

The SQL builder retains the v1 method names and query operators, including `makeWhere`, `makeFind`, `$eq`, `$neq`, `$in`, `$between`, `$and`, and `$or`. Raw update expressions such as `{{score + 1}}` are also supported for migration, but they must contain trusted application-owned SQL rather than user input.

Real MySQL 5.7 and MySQL 8.4 integration tests run in GitHub Actions. The local test suite uses a Promise Pool contract double and does not require Docker.

## License

MIT
