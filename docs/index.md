# Toshihiko

Toshihiko is a small ORM for Node.js. It maps database rows to models, builds predictable queries, and provides an optional cache layer.

The scope is deliberately narrow. Toshihiko does not create tables, manage migrations, define relationships, or hide database design behind model metadata. Applications own their schemas; Toshihiko handles the CRUD work around them.

Version 2 keeps the model vocabulary and runtime behavior of Toshihiko 1.x while moving the codebase to TypeScript and native Promises.

## A first model

```typescript
import { Toshihiko, Type } from 'toshihiko';

const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  password: 'secret',
  username: 'root',
});

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

const user = User.build({ name: 'Alice' });
await user.insert();

const rows = await User
  .where({ name: { $like: 'A%' } })
  .orderBy({ id: 'desc' })
  .limit(10)
  .find();
```

The schema drives both runtime mapping and TypeScript inference. `user.name` is a `string`, `user.id` is an optional `number` until it is known, and query conditions use the same field names and value types.

## Where to continue

- [Getting started](getting-started.md) covers installation, connections, and the first complete CRUD flow.
- [Model definition](model/definition.md) describes fields, defaults, validators, primary keys, and model cache options.
- [Model usage](model/usage.md) lists the query and transaction entry points exposed by a Model.
- [Querying](querying.md) documents conditions, ordering, field selection, limits, and query options.
- [Yukari instances](yukari.md) explains row objects and their write lifecycle.
- [Data types](types.md) covers built-in and custom field types.

## About the name

Toshihiko is a character from [Touhou Warring States Nights](https://tieba.baidu.com/p/1386358409), a collaborative Touhou fan work. The name has been part of the project since its first release in 2014.
