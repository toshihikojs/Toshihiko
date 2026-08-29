# Migrating from v1

Toshihiko v2 is a TypeScript refactor of the v1 model. The migration should be
approached as a package and asynchronous-syntax update, followed by adopting
types where they are useful. Existing Model, Query, and Yukari concepts remain
the starting point.

## Requirements

- Upgrade the application to Node.js 22 or 24.
- Install the v2 core and a scoped Adapter package.
- Install a scoped Cache package when the application uses Redis or Memcached.

```bash
npm install toshihiko@next @toshihiko/mysql-adapter@next
```

The exact prerelease tag may change before v2 becomes stable. Keep all locked
v2 packages on compatible releases.

## Package mapping

| v1 package or behavior | v2 package |
|---|---|
| Core `toshihiko` | `toshihiko` |
| Built-in `mysql` dialect dependencies | `@toshihiko/mysql-adapter` |
| `toshihiko-redis` | `@toshihiko/redis-cache` |
| `toshihiko-memcached` | `@toshihiko/memcached-cache` |
| Custom Adapter base | `@toshihiko/base-adapter` |
| Custom Cache base | `@toshihiko/base-cache` |

The original `mysql` dialect string still works after the scoped MySQL Adapter
is installed.

## Create a connection

```typescript
import { Toshihiko } from 'toshihiko';

const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  password: 'secret',
  username: 'root',
});
```

Adapter constructors and instances can also be injected for explicit dependency
control.

## Keep the Model definition

The familiar `define(table, fields, options)` shape remains:

```typescript
const User = database.define('users', [
  {
    name: 'id',
    column: 'user_id',
    type: Type.Integer,
    primaryKey: true,
    autoIncrement: true,
  },
  { name: 'name', type: Type.String },
]);
```

JavaScript runtime normalization retains v1 snake-case field option aliases.
TypeScript code should use `primaryKey`, `autoIncrement`, `allowNull`, and
`defaultValue` so the schema can be validated and inferred.

## Use native Promises

Asynchronous extension points and operations return native Promises:

```typescript
const users = await User.where({ name: 'Alice' }).find();

const user = User.build({ name: 'Bob' });
await user.insert();
```

Validators can return a message or a Promise of a message:

```typescript
validators: async (value) => {
  if (await nameExists(value)) return 'name already exists';
}
```

## Move Model methods into `define()`

JavaScript assignment still behaves as it did in v1:

```javascript
User.findByName = function findByName(name) {
  return this.where({ name }).findOne();
};
```

For TypeScript, declare custom methods in the third argument so their
parameters, return values, `this`, and sibling calls are inferred:

```typescript
const User = database.define('users', userSchema, {
  methods: {
    findByName(name: string) {
      return this.where({ name }).findOne();
    },
  },
});

await User.findByName('Alice');
```

## Preserve the Yukari lifecycle

`build()` creates a new Yukari. `insert()` writes it and adopts Adapter readback
values, but it remains a new Yukari as in v1. Query the row before updating or
deleting it.

```typescript
const built = User.build({ name: 'Alice' });
await built.insert();

const queried = await User.findById(built.id);
if (queried) {
  queried.name = 'Updated Alice';
  await queried.save();
}
```

## Update Cache construction

Direct construction is the clearest typed form:

```typescript
const cache = new RedisCache('127.0.0.1:6379', { prefix: 'app:' });
const database = new Toshihiko('mysql', { cache, database: 'app' });
```

The v1 module-style cache source remains available to JavaScript applications,
but direct instances expose their options and methods to TypeScript.

## Compatibility checklist

- Model field and column mapping
- Composite and generated primary keys
- Query operators and chain shapes
- `find()`, `findOne()`, `findById()`, and `count()`
- Yukari insert, update, delete, save, validation, and JSON conversion
- Raw execution and transaction connection order
- Redis and Memcached key and miss behavior
- Dynamic JavaScript Model extension
- Custom Field Types

Run the application's own integration tests after the package update. The v2
repository regression suite covers the published v1 behavior, but it cannot
prove assumptions made by an application's custom Adapter, Cache, or raw SQL.

## What Toshihiko still does not own

The upgrade does not introduce schema creation, migrations, relationships, or
foreign-key management. Keep those responsibilities in the application's
existing database workflow.
