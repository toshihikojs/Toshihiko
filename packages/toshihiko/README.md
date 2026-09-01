# Toshihiko

[![npm](https://img.shields.io/npm/v/toshihiko/next.svg)](https://www.npmjs.com/package/toshihiko/v/next)
[![CI](https://github.com/toshihikojs/Toshihiko/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/toshihikojs/Toshihiko/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/github/toshihikojs/Toshihiko/branch/master/graph/badge.svg?flag=toshihiko)](https://app.codecov.io/github/toshihikojs/Toshihiko/tree/master)

The typed core of Toshihiko: Model, Query, Yukari, field types, and Adapter and Cache contracts.

## Installation

Install the core together with a database Adapter:

```bash
npm install toshihiko @toshihiko/mysql-adapter
```

Node.js 22 or newer is required.

## Usage

```typescript
import { Toshihiko, Type } from 'toshihiko';

const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
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

The schema supplies both runtime mapping and TypeScript inference. Query field names, conditions, primary keys, Yukari properties, and JSON output all derive from the same definition.

## Documentation

The complete v2 guide lives in the [repository documentation](../../docs/index.md):

- [Getting started](../../docs/getting-started.md)
- [Model definition](../../docs/model/definition.md)
- [Model usage](../../docs/model/usage.md)
- [Querying](../../docs/querying.md)
- [Yukari instances](../../docs/yukari.md)
- [Data types](../../docs/types.md)
- [Complete type index](https://toshihikojs.github.io/Toshihiko/typedoc/modules/toshihiko.html)

## License

MIT
