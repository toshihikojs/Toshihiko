# `Toshihiko`

`Toshihiko` is one configured database entry point. An application normally creates one instance and uses it to define Models.

## Create an instance

In TypeScript, pass the Adapter class directly when possible. This lets the constructor check the Adapter's actual configuration type.

```typescript
import { Toshihiko } from 'toshihiko';
import { MySQLAdapter } from '@toshihiko/mysql-adapter';

const database = new Toshihiko(MySQLAdapter, {
  database: 'app',
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  password: 'secret',
});
```

The shorter dialect-name form is also available. `'mysql'` loads `@toshihiko/mysql-adapter`.

```typescript
const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  username: 'root',
});
```

### MySQL options

With the official MySQL Adapter, `options` is `MySQLAdapterOptions`. These are the commonly used fields.

| Field | Type | Default | Description |
|---|---|---:|---|
| `database` | `string` | `'toshihiko'` | Database name and Cache database namespace |
| `host` | `string` | `'localhost'` | MySQL host name or IP address |
| `port` | `number` | `3306` | MySQL port |
| `user` | `string` | `''` | MySQL user name |
| `username` | `string` | — | Compatibility spelling for `user`; wins when both are present |
| `password` | `string` | `''` | MySQL password |
| `pool` | `MySQLPool` | — | Reuses an existing `mysql2/promise` Pool; omitting it creates a Pool |
| `showSql` | `false \| true \| ((sql: string) => void)` | `false` | `true` logs with `console.log`; a function receives formatted SQL |
| `cache` | `CacheSource` | — | Database-level Cache inherited by Models |
| Other fields | [`mysql2.PoolOptions`](https://sidorares.github.io/node-mysql2/docs/examples/connections/create-pool) | Set by `mysql2` | Includes `connectionLimit`, `charset`, `ssl`, and timeout settings |

See [MySQL Adapter API](mysql#options) for the complete MySQL configuration. Other Adapters define their own `options` objects.

### Constructor arguments

| Argument | Accepted value | Description |
|---|---|---|
| `adapter` | Dialect name, Adapter class, or Adapter instance | Selects the database implementation; an Adapter class supplies configuration types |
| `options` | Configuration object for the selected Adapter | Passed to the Adapter and retained as `database.options` |

Do not pass `options` when supplying an already constructed Adapter instance.

```typescript
const adapter = new MySQLAdapter({ database: 'app' });
const database = new Toshihiko(adapter);
```

## Properties

| Property | Application type | Value |
|---|---|---|
| `database` | `string` | Current database name reported by the Adapter |
| `dialect` | `string \| null` | Dialect name, or usually the Adapter class name for an injected Adapter |
| `options` | Configuration object for the selected Adapter | Original constructor options |
| `cache` | `Cache \| null \| undefined` | Current database-level Cache |
| `pool` | `MySQLPool` for MySQL; otherwise `undefined` | MySQL pool compatibility entry point |

## `define()`

```typescript
database.define(name, schema, options?)
```

| Argument | Type | Description |
|---|---|---|
| `name` | `string` | Table name; a string literal is retained in the Model type |
| `schema` | `readonly FieldDefinition[]` | Field names, Field Types, columns, keys, defaults, and validators |
| `options.cache` | `CacheSource \| false \| null` | Replaces or disables the inherited Cache |
| `options.methods` | Method object | Methods copied to the Model with their parameter and return types intact |

```typescript
const User = database.define('users', [
  { name: 'id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
], {
  cache: false,
  methods: {
    async findByName(name: string) {
      return this.where({ name }).find();
    },
  },
});

const users = await User.findByName('Yukari');
```

The returned Model derives field names, values, nullability, primary keys, and JSON values from `schema`. Use method shorthand or a normal `function` in `methods` so TypeScript can infer `this` as the complete Model.

## `execute()`

Raw execution arguments and results come from the Adapter. The official MySQL Adapter provides these forms:

```typescript
database.execute(
  sql: string,
  values?: MySQLValues,
): Promise<MySQLQueryResult>

database.execute(
  connection: MySQLConnection | null,
  sql: string,
  values?: MySQLValues,
): Promise<MySQLQueryResult>
```

`MySQLValues` is a readonly array or a readonly object keyed by parameter name. See [Raw SQL](../raw-sql).

## `Toshihiko.createCache()`

```typescript
Toshihiko.createCache(source: unknown): Cache | null
```

An existing Cache is returned unchanged. Module-style configuration creates a Cache, and an unrecognized value returns `null`. Applications normally construct a Cache directly; module-style configuration remains for compatibility. See [Cache API](cache).

## Generics for Adapter authors

Application code does not write these generics. They let a custom Adapter carry its options, connection, and execution-result types into Model and Query.

```typescript
class Toshihiko<
  AdapterInstance extends AdapterLike = Adapter,
  Options extends object = ToshihikoOptions,
> extends EventEmitter2

type AdapterSource<Options extends object, Instance extends AdapterLike> =
  | string
  | Instance
  | AdapterConstructor<Options, Instance>;
```
