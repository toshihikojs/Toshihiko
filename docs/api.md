# API reference

This reference lists the public runtime values, method signatures, return
types, and extension contracts. The guide pages explain complete workflows;
this page is for looking up a specific member.

## Package entry points

| Package | Runtime exports | Purpose |
|---|---|---|
| `toshihiko` | `Toshihiko`, `Type`, `Adapter`, `Escaper` | Core Model, Query, and Yukari API |
| `@toshihiko/mysql-adapter` | `MySQLAdapter`, `MySQLSqlBuilder` | MySQL execution and SQL generation |
| `@toshihiko/base-adapter` | `Adapter`, `extend` | Base class for Adapter authors |
| `@toshihiko/base-cache` | `Cache` | Base class for Cache authors |
| `@toshihiko/redis-cache` | `RedisCache`, `create` | Redis Cache implementation |
| `@toshihiko/memcached-cache` | `MemcachedCache`, `create` | Memcached Cache implementation |
| `@toshihiko/sql-utils` | `escape`, `escapeLike`, `sqlNameToColumn` | SQL string compatibility helpers |

All packages use CommonJS at runtime and publish TypeScript declarations.

## `Toshihiko`

`Toshihiko` owns one Adapter and creates Models bound to it.

### Constructor

```typescript
new Toshihiko(adapter, options?)
```

The `adapter` argument accepts one of three forms:

| Form | Example | Behavior |
|---|---|---|
| Dialect name | `new Toshihiko('mysql', options)` | Loads `@toshihiko/mysql-adapter` |
| Adapter constructor | `new Toshihiko(MySQLAdapter, options)` | Constructs the Adapter with the Toshihiko instance and options |
| Adapter instance | `new Toshihiko(adapter)` | Uses the supplied instance directly |

When a constructor is supplied, its option type determines whether `options`
is required and which properties it accepts.

### Properties

| Property | Type | Description |
|---|---|---|
| `adapter` | selected Adapter type | Concrete Adapter instance |
| `cache` | `Cache \| null \| undefined` | Database-level Cache configured through the Adapter options |
| `database` | `string` | Value returned by `adapter.getDBName()` |
| `dialect` | `string \| null` | Dialect name or Adapter constructor name |
| `options` | selected option type | Normalized constructor options |
| `pool` | Adapter-dependent | Pool exposed by Adapters such as `MySQLAdapter` |

### `define()`

```typescript
database.define(name, schema, options?)
```

Creates a Model. The literal `name`, schema field names, field value types,
nullability, primary keys, and custom methods are retained in the returned
type.

```typescript
const User = database.define('users', [
  { name: 'id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
  { name: 'birthday', type: Type.Datetime, allowNull: true },
], {
  cache: false,
  methods: {
    async findByName(name: string) {
      return this.where({ name }).find();
    },
  },
});
```

The ordinary array literal keeps field-level inference; no `as const` suffix
is required. A method declared with method shorthand receives a contextual
`this` typed as the Model plus every method in the same `methods` object.
The functions are copied onto the Model runtime object.

| Option | Type | Description |
|---|---|---|
| `cache` | `CacheSource \| false \| null` | Override, disable, or clear the database-level Cache |
| `methods` | method object | Add application Model methods with contextual `this` |

### Other methods

| Signature | Returns | Description |
|---|---|---|
| `getAdapter()` | concrete Adapter | Preserve the selected Adapter type |
| `execute(...args)` | Adapter execute result | Forward raw execution to the Adapter |
| `Toshihiko.createCache(source)` | `Cache \| null` | Normalize a Cache instance or module-style configuration |

## `Model`

A Model is the static table API returned by `define()`. It also extends
`EventEmitter2`.

### Metadata

| Property | Description |
|---|---|
| `name` | Literal table or collection name |
| `parent`, `toshihiko` | Owning Toshihiko instance |
| `options` | Model definition options |
| `originalSchema` | Original schema definitions |
| `schema`, `_fields` | Compiled `Field` objects; `_fields` is a compatibility alias |
| `primaryKeys` | Compiled primary-key Fields |
| `autoIncrementField`, `ai` | Auto-increment Field or `null`; `ai` is a compatibility alias |
| `nameToColumn`, `columnToName` | Logical/storage name maps |
| `fieldNamesMap`, `fieldColumnsMap` | Field lookup maps |
| `cache` | Resolved Model Cache or `null` |

### Row creation

```typescript
Model.build(fields)
```

Returns a new `BuiltYukari`. Input keys must come from the schema. The input is
partial because database defaults and auto-increment values may be absent.
Fields supplied by the caller, or supplied by a field default, are known on
the returned value; other fields remain optional.

### Query starters

Each method creates a new Query.

| Signature | Description |
|---|---|
| `where(condition)` | Set typed query conditions |
| `field(fields)`, `fields(fields)` | Select a comma-separated string or field-name array |
| `limit(count)` | Limit result count |
| `limit(offset, count)` | Set offset and result count |
| `index(name)` | Set an Adapter-specific index hint |
| `order(order)`, `orderBy(order)` | Set ordering |
| `conn(connection)` | Bind an Adapter connection or `null` |

### Read and mutation shortcuts

These methods create a Query and immediately execute it.

| Signature | Returns |
|---|---|
| `find(...)` | Yukari list, one Yukari, JSON rows, or `null`, according to overload |
| `findOne(toJSON?)` | one Yukari or JSON row, otherwise `null` |
| `findById(id, toJSON?)` | primary-key match or `null` |
| `count()` | `Promise<number>` |
| `update(data)` | Adapter mutation result |
| `delete()` | Adapter mutation result |
| `execute(...args)` | Adapter execute result |

Calling `update()` or `delete()` directly on a Model creates an unrestricted
Query. Add `where()` first when only part of a table should be modified.

### Transactions and mapping

| Signature | Description |
|---|---|
| `beginTransaction()` | Ask the Adapter for a transaction connection |
| `commit(connection)` | Commit an Adapter transaction |
| `rollback(connection)` | Roll back an Adapter transaction |
| `convertColumnToName(value)` | Convert a column string, string array, or object to logical field names |
| `getPrimaryKeysName()` | Return one primary-key name, multiple names, or an empty array |
| `getPrimaryKeysColumn()` | Return one primary-key column, multiple columns, or an empty array |

## `Query`

Query builder methods mutate and return the same Query instance. Create a new
chain from the Model when the previous configuration must be preserved.

### Query state

| Property | Description |
|---|---|
| `model` | Source Model |
| `toshihiko` | Owning Toshihiko instance |
| `adapter` | Adapter captured at construction |
| `cache` | Model Cache captured at construction |
| `_conn` | Bound connection or `null` |
| `_fields`, `_where`, `_limit`, `_order`, `_index` | Adapter-facing compiled query state |

The underscore-prefixed properties are exposed for Adapter compatibility.
Application code should use the builder methods.

### Conditions

`where()` accepts schema field names and recursively supports `$and` and
`$or`.

```typescript
User.where({
  $or: [
    { name: { $like: 'A%' } },
    { id: { $between: [10, 20] } },
  ],
});
```

Field operators are typed from the field value:

| Operator | Meaning |
|---|---|
| `$eq`, `===` | Equal |
| `$neq`, `!==` | Not equal |
| `$gt`, `>` | Greater than |
| `$gte`, `>=` | Greater than or equal |
| `$lt`, `<` | Less than |
| `$lte`, `<=` | Less than or equal |
| `$between` | Inclusive two-value range |
| `$in` | Match one value from an array |
| `$like` | Adapter-specific pattern match |
| `$and`, `$or` | Combine values for one field |

### Ordering and limits

```typescript
query.orderBy({ createdAt: 'desc' });
query.order('createdAt DESC, id ASC');
query.limit(20);
query.limit(40, 20);
```

Directions accept `'asc'`, `'ASC'`, `'desc'`, `'DESC'`, or a number.
Strings and arrays are retained for compatibility; object form gives the best
field-name checking.

### Reading

```typescript
find()
find(options)
find(toJSON, options?)
find(options, toJSON)
```

| Option | Default | Effect |
|---|---:|---|
| `single` | `false` | Return one result or `null` instead of an array |
| `noCache` | `false` | Bypass the configured Cache |
| `toJSON` argument | `false` | Return serialized plain objects instead of Yukari objects |

`findOne(toJSON?)` is the single-row shortcut. `findById(id, toJSON?)`
creates a primary-key condition and consults the Cache when one is configured.
For a composite key, pass an object containing the key fields.

### Executing

| Signature | Returns |
|---|---|
| `count()` | `Promise<number>` |
| `update(data)` | Adapter mutation result |
| `delete()` | Adapter mutation result |
| `execute(...args)` | Adapter execute result using the bound connection |

## `Yukari`

A Yukari is a row object. Mapped schema fields are enumerable properties on the
instance.

### State

| Property | Description |
|---|---|
| `$model`, `$toshihiko`, `$adapter` | Captured execution context |
| `$schema` | Compiled Model schema |
| `$source` | `'new'`, `'query'`, or `'delete'` |
| `$origData` | Original queried-value snapshot |
| `$dbName`, `$tableName` | Storage location |
| `$cache` | Resolved Cache |
| `$fromCache` | Whether the row was hydrated from Cache |

### Methods

| Signature | Returns | Rules |
|---|---|---|
| `validateOne(name, value)` | `Promise<void>` | Runs the selected field validators |
| `validateAll()` | `Promise<void>` | Validates mapped enumerable values |
| `insert(connection?)` | `Promise<this>` | Only valid for a new Yukari |
| `update(connection?)` | `Promise<this>` | Rejects a new Yukari; locates by original values |
| `delete(connection?)` | `Promise<true>` | Rejects a new Yukari and marks the source as deleted |
| `save(connection?)` | `Promise<this>` | Inserts new rows and updates queried rows |
| `toJSON(useOriginalData?)` | serialized partial row | Applies each Field Type's `toJSON()` conversion |

After `insert()`, the same object still represents the newly built row. Query
it before calling `update()` or `delete()`.

## Schema and `Field`

### Field definitions

| Property | Default | Effect |
|---|---:|---|
| `name` | required | Application property name |
| `column` | `name` | Storage column name |
| `type` | `Type.String` | Parse, restore, equality, and JSON behavior |
| `allowNull` | `false` | Adds `null` to the field value type |
| `primaryKey` | `false` | Adds the field to primary-key lookup |
| `autoIncrement` | `false` | Marks generated storage values |
| `defaultValue` | Field Type default | Default used by `build()` |
| `validators` | `[]` | One validator or an array of validators |

A validator returns nothing for success or a non-empty error message for
failure. It may return a Promise. Validators are called with the Model as
`this`.

### Compiled `Field`

| Member | Description |
|---|---|
| `parse(storageValue)` | Convert storage data to the application value |
| `restore(value)` | Convert an application value for storage |
| `equal(left, right)` | Compare values for change tracking |
| `toJSON(value)` | Convert a value for JSON output |
| `defaultValue`, `needQuotes` | Resolved Field Type metadata |

### Built-in `Type` values

| Type | Application value | Storage/JSON behavior |
|---|---|---|
| `Type.String` | `string` | Normalizes with `String()` |
| `Type.Boolean` | `boolean` | Restores as `0` or `1` |
| `Type.Integer` | `number` | Uses `parseInt()` |
| `Type.Float` | `number` | Uses `parseFloat()` |
| `Type.Json` | `JsonValue` | Parses and stringifies JSON |
| `Type.Datetime` | `Date` | Restores MySQL-style datetime text and serializes ISO-style text |

A custom `FieldType<Value, StorageValue, JsonValue>` implements
`parse()` and `restore()`. Add `equal()`, `toJSON()`,
`defaultValue`, and `needQuotes` when required.

## Cache contract

```typescript
interface Cache {
  getData<Value extends object>(
    database: string,
    table: string,
    keys: CacheKey | readonly CacheKey[],
  ): Promise<(Value | null)[]>;

  setData<Value extends object>(
    database: string,
    table: string,
    key: CacheKey,
    data: Value,
  ): Promise<void | boolean | 'OK' | null>;

  deleteData(
    database: string,
    table: string,
    key: CacheKey,
  ): Promise<void | boolean | number>;

  deleteKeys(
    database: string,
    table: string,
    keys: readonly CacheKey[],
  ): Promise<void | readonly number[]>;
}
```

`CacheKey` accepts primitive keys, objects for composite keys, and
`null`/`undefined` for implementation-defined table keys.

`@toshihiko/base-cache` exports an abstract `Cache` class with this exact
contract. Redis and Memcached packages export a concrete class and a
`create(servers, options?)` factory. See [Caching](caching) and
[Writing extensions](extensions).

## Adapter contract

`@toshihiko/base-adapter` exports an `Adapter` class. An implementation
provides:

| Method | Responsibility |
|---|---|
| `find(query, options?)` | Read one or many storage rows |
| `count(query)` | Count matching rows |
| `updateByQuery(query)` | Update matching rows |
| `deleteByQuery(query)` | Delete matching rows |
| `insert(model, connection, data)` | Insert and return the row data adopted by Yukari |
| `update(model, connection, primaryKey, data)` | Update one Yukari |
| `execute(...args)` | Execute Adapter-specific raw commands |
| `getDBName()` | Return the Cache database namespace |
| `beginTransaction()`, `commit()`, `rollback()` | Transaction lifecycle |

Base methods reject asynchronously with a not-implemented error. The Adapter
generic parameters describe its options, Model, connection, Field, value, and
Query boundaries.

## MySQL Adapter

```typescript
import {
  MySQLAdapter,
  type MySQLAdapterOptions,
  type MySQLConnection,
  type MySQLMutationResult,
  type MySQLQueryResult,
} from '@toshihiko/mysql-adapter';
```

`MySQLAdapterOptions` extends `mysql2` pool options and adds:

| Option | Description |
|---|---|
| `database` | Database name |
| `user`, `username` | MySQL user; `username` is accepted for compatibility |
| `password` | MySQL password |
| `pool` | Existing `mysql2/promise` Pool |
| `showSql` | `true` for console output or a function receiving each SQL string |
| `package` | Compatibility package name |

```typescript
await database.execute(sql, values);
await database.execute(connection, sql, values);
await User.conn(connection).execute(sql, values);
```

The first two forms use `Toshihiko.execute()`; the third uses
`Query.execute()`. The package also exports `MySQLSqlBuilder` and its
Adapter-facing Model, Query, Field, statement, connection, pool, and result
types.

## SQL helpers

`Escaper.escape()` and `Escaper.escapeLike()` are compatibility accessors
for the same functions in `@toshihiko/sql-utils`.

| Function | Description |
|---|---|
| `escape(value)` | Escape quotes, control characters, and backslashes in a string |
| `escapeLike(value)` | Escape `%` and `_` wildcard characters |
| `sqlNameToColumn(sql, map)` | Replace logical names in a SQL fragment while preserving quoted strings and SQL keywords |

Prefer Adapter parameter binding for user-controlled values. The escaping
helpers do not replace prepared statements.

## Type utilities

The core package exports the following groups of types:

| Group | Common exports |
|---|---|
| Model inference | `InferModelRow`, `InferModelPrimaryKey`, `BuildInput`, `BuiltRowFromSchema` |
| Row objects | `Yukari`, `BuiltYukari`, `QueriedYukari`, `YukariSource` |
| Schema | `FieldDefinition`, `FieldType`, `SchemaDefinition`, `RowFromSchema`, `JsonRowFromSchema`, `PrimaryKeyNames` |
| Query | `Query`, `QueryWhere`, `QueryFieldOperators`, `QueryOrder`, `QueryFindOptions`, `FindByIdInput` |
| Adapter | `Adapter`, `AdapterConstructor`, `AdapterConnection`, `AdapterData`, `AdapterQuery`, execute and mutation result helpers |
| Cache | `Cache`, `CacheKey`, `CacheSource`, `CacheOptions`, Cache result types |

```typescript
type UserRow = InferModelRow<typeof User>;
type UserPrimaryKey = InferModelPrimaryKey<typeof User>;
```

Use the concrete types exported by an Adapter package whenever code crosses
that Adapter's connection, options, or result boundary.
