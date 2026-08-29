# Getting started

## Requirements

Toshihiko v2 requires Node.js 22 or newer. The packages are currently published on the `2.0.0-alpha` prerelease line.

## Installation

Install the core package together with a database Adapter. For MySQL:

```bash
npm install toshihiko @toshihiko/mysql-adapter
```

The MySQL Adapter uses `mysql2` and is loaded automatically when the `mysql` dialect name is passed to `Toshihiko`.

## Create a connection

```typescript
import { Toshihiko } from 'toshihiko';

const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  password: 'secret',
  port: 3306,
  username: 'root',
});
```

An Adapter constructor can also be injected directly:

```typescript
import { MySQLAdapter } from '@toshihiko/mysql-adapter';
import { Toshihiko } from 'toshihiko';

const database = new Toshihiko(MySQLAdapter, {
  database: 'app',
  host: '127.0.0.1',
  username: 'root',
});
```

## Define a model

Create the table with your normal schema or migration tooling, then describe the row mapping with `define()`:

```sql
CREATE TABLE `users` (
  `user_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `birthday` DATETIME NULL,
  PRIMARY KEY (`user_id`)
);
```

```typescript
import { Type } from 'toshihiko';

const User = database.define('users', [
  {
    name: 'id',
    column: 'user_id',
    type: Type.Integer,
    primaryKey: true,
    autoIncrement: true,
  },
  {
    name: 'name',
    type: Type.String,
  },
  {
    name: 'birthday',
    type: Type.Datetime,
    allowNull: true,
  },
]);
```

`name` is the property used by application code. `column` is the database column and defaults to `name` when omitted.

## Insert and query rows

`build()` creates a new Yukari row object. `insert()` validates it, writes it, and adopts values returned by the Adapter, including generated IDs.

```typescript
const user = User.build({
  name: 'Alice',
  birthday: null,
});

await user.insert();

const found = await User.findById(user.id);
if (found) {
  console.log(found.name);
}
```

Queries are chainable:

```typescript
const users = await User
  .where({ id: { $gte: 1 } })
  .orderBy({ id: 'desc' })
  .limit(20)
  .find();
```

## Update and delete rows

Queried Yukari objects keep their original values so updates can send changed fields and locate the row by its original primary key.

```typescript
const found = await User.findById(1);

if (found) {
  found.name = 'Updated Alice';
  await found.save();
  await found.delete();
}
```

An inserted Yukari remains a new row. Query the row before updating or deleting it.

## Return plain objects

Pass `true` to `find()`, `findOne()`, or `findById()` when the result should be serialized immediately:

```typescript
const rows = await User.where({ name: 'Alice' }).find(true);
const row = await User.findById(1, true);
```

Datetime fields become strings in their JSON form. Custom field types may define their own `toJSON()` conversion.
