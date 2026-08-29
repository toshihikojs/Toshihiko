# API reference

This page is a map of the public v2 API. Guide pages explain behavior and show
complete workflows; generated TypeScript declarations remain the exact source
for generic and Adapter-specific overloads.

## Runtime exports

```typescript
import {
  Adapter,
  Escaper,
  Toshihiko,
  Type,
} from 'toshihiko';
```

| Export | Description |
|---|---|
| `Toshihiko` | Database entry point and Model factory. |
| `Type` | Built-in Field Type implementations. |
| `Adapter` | Compatibility accessors for the base and MySQL Adapter constructors. |
| `Escaper` | `escape()` and `escapeLike()` compatibility helpers. |

## `Toshihiko`

### Constructor

```typescript
new Toshihiko(adapter, options?)
```

`adapter` may be a dialect name, an Adapter constructor, or an Adapter instance.
Required options are derived from the selected Adapter constructor.

### Properties and methods

| Member | Description |
|---|---|
| `adapter` | Concrete Adapter instance. |
| `cache` | Configured database Cache, `null`, or `undefined`. |
| `database` | Database name returned by the Adapter. |
| `dialect` | Loaded dialect or constructor name when available. |
| `options` | Constructor options. |
| `pool` | Adapter pool when the Adapter exposes one. |
| `define(name, schema, options?)` | Create a typed Model. |
| `execute(...args)` | Forward raw execution to the Adapter. |
| `getAdapter()` | Return the concrete Adapter type. |
| `Toshihiko.createCache(source)` | Normalize a Cache instance or module-style cache source. |

## `Model`

Models are returned by `define()`.

| Member | Description |
|---|---|
| `name` | Table or collection name. |
| `parent`, `toshihiko` | Owning Toshihiko instance. |
| `originalSchema` | Schema passed to `define()`. |
| `schema`, `_fields` | Compiled Field objects. |
| `primaryKeys` | Compiled primary-key Fields. |
| `autoIncrementField`, `ai` | Generated Field or `null`. |
| `nameToColumn`, `columnToName` | Logical and physical name maps. |
| `fieldNamesMap`, `fieldColumnsMap` | Field lookup maps. |
| `cache` | Resolved Model Cache or `null`. |
| `build(fields)` | Create a new Yukari. |
| `where(condition)` | Start a Query with conditions. |
| `field()`, `fields()` | Start a Query with selected fields. |
| `limit()` | Start a Query with a row limit. |
| `index()` | Start a Query with a forced index. |
| `order()`, `orderBy()` | Start a Query with ordering. |
| `conn()` | Start a Query on an existing connection. |
| `find()`, `findOne()`, `findById()` | Read rows. |
| `count()` | Count rows. |
| `update(data)` | Update rows represented by a new Query. |
| `delete()` | Delete rows represented by a new Query. |
| `execute()` | Execute through a new Query. |
| `beginTransaction()`, `commit()`, `rollback()` | Adapter transaction facade. |
| `convertColumnToName()` | Map storage column names to logical names. |
| `getPrimaryKeysName()` | Return primary-key logical names. |
| `getPrimaryKeysColumn()` | Return primary-key storage columns. |

Methods declared in `define(..., { methods })` are added to the returned Model
type and runtime object.

## `Query`

Query configuration methods mutate and return the same Query instance.

| Member | Description |
|---|---|
| `model` | Source Model. |
| `adapter` | Adapter captured when the Query is constructed. |
| `cache` | Model Cache captured when constructed. |
| `where(condition)` | Merge a condition into the query. |
| `field()`, `fields()` | Set selected fields. |
| `limit()` | Set count or offset/count. |
| `order()`, `orderBy()` | Set ordering. |
| `index(name)` | Set an Adapter-specific index. |
| `conn(connection)` | Set an Adapter connection. |
| `find(...)` | Read a list or a single row; optionally return JSON. |
| `findOne(toJSON?)` | Read one row or `null`. |
| `findById(id, toJSON?)` | Read by the Model primary key. |
| `count()` | Return the Adapter count. |
| `update(data)` | Run Adapter query update. |
| `delete()` | Run Adapter query delete. |
| `execute(...args)` | Run Adapter query execution. |

See [Querying](querying.md) for condition and result overloads.

## `Yukari`

| Member | Description |
|---|---|
| `$model`, `$toshihiko`, `$adapter` | Captured Model and execution boundary. |
| `$schema` | Compiled schema. |
| `$source` | `new`, `query`, or `delete`. |
| `$origData` | Original queried field snapshot. |
| `$fromCache` | Whether the row was hydrated from Cache. |
| `validateOne(name, value)` | Validate one field value. |
| `validateAll()` | Validate every present mapped field. |
| `insert(connection?)` | Insert a new Yukari. |
| `update(connection?)` | Update a queried Yukari. |
| `delete(connection?)` | Delete a queried Yukari and return `true`. |
| `save(connection?)` | Insert new rows or update queried rows. |
| `toJSON(original?)` | Serialize current or original mapped values. |

Mapped fields are properties on the Yukari object and derive from its Model
schema.

## `Type`

| Type | Application value |
|---|---|
| `Type.String` | `string` |
| `Type.Boolean` | `boolean` |
| `Type.Integer` | `number` |
| `Type.Float` | `number` |
| `Type.Json` | JSON value |
| `Type.Datetime` | `Date` |

See [Field types](types.md) for storage conversion, defaults, equality, and JSON
conversion.

## Common public types

```typescript
import type {
  Adapter,
  AdapterConnection,
  AdapterData,
  AdapterQuery,
  BuiltYukari,
  Cache,
  CacheKey,
  FieldDefinition,
  FieldType,
  InferModelPrimaryKey,
  InferModelRow,
  Model,
  QueriedYukari,
  Query,
  QueryFieldOperators,
  QueryOrder,
  QueryWhere,
  RowFromSchema,
  SchemaDefinition,
  Yukari,
} from 'toshihiko';
```

Adapter-specific packages export their concrete options, connection, driver
result, and mutation result types. Prefer those types when application code
crosses the Adapter boundary.

## Cache interface

```typescript
interface Cache {
  getData<Value extends object>(database, table, keys): Promise<(Value | null)[]>;
  setData<Value extends object>(database, table, key, data): Promise<CacheSetResult>;
  deleteData(database, table, key): Promise<CacheDeleteResult>;
  deleteKeys(database, table, keys): Promise<CacheDeleteKeysResult>;
}
```

See [Caching](caching.md) and [Writing extensions](extensions.md).
