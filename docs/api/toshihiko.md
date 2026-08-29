# `Toshihiko`

`Toshihiko` configures one database backend and creates Models bound to it. Import it from the core package.

```typescript
import { Toshihiko } from 'toshihiko';
```

## Constructor

```typescript
new Toshihiko(adapter, options?)
```

### Parameters

| Name | Type | Description |
|---|---|---|
| `adapter` | dialect name, Adapter constructor, or Adapter instance | Selects the storage implementation |
| `options` | inferred from the Adapter constructor | Passed to the Adapter and retained as `database.options` |

The `options` parameter becomes required when the selected Adapter declares required options.

```typescript
const byName = new Toshihiko('mysql', mysqlOptions);
const byConstructor = new Toshihiko(MySQLAdapter, mysqlOptions);
const byInstance = new Toshihiko(new MySQLAdapter(mysqlOptions));
```

A plain name such as `'mysql'` loads `@toshihiko/mysql-adapter`. A name beginning with `.`, `/`, or `@` is loaded as written.

## Properties

| Property | Type | Description |
|---|---|---|
| `cache` | `Cache \| null \| undefined` | Database-level Cache configured in Adapter options |
| `database` | `string` | Current database namespace |
| `dialect` | `string \| null` | Dialect name or Adapter constructor name |
| `options` | selected options type | Constructor options |
| `pool` | Adapter-specific pool or `undefined` | Compatibility facade for Adapters exposing a `mysql` property |

## `define()`

```typescript
database.define(name, schema, options?)
```

Creates a [Model](model) bound to this Toshihiko instance. Its return type retains the literal table name, schema field names, field value types, nullability, primary keys, and custom methods.

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

### Parameters

| Name | Type | Description |
|---|---|---|
| `name` | `string` literal | Table or collection name |
| `schema` | `SchemaDefinition` | Ordinary array literal of field definitions |
| `options.cache` | `CacheSource \| false \| null` | Override, disable, or clear the inherited Cache |
| `options.methods` | method object | Methods copied onto the returned Model |

Use method shorthand inside `methods`. TypeScript then supplies a contextual `this` containing the Model and every method in the same object. Arrow functions do not receive this contextual `this`.

### Returns

```typescript
Model<Name, Schema, AdapterInstance> & Methods
```

The schema is checked against the Adapter's declared Model, Query, Field, connection, and value boundaries during compilation.

## `execute()`

```typescript
database.execute(...args): Promise<AdapterExecuteResult>
```

Forwards the arguments to the Adapter. Both arguments and result are inferred from the concrete Adapter. With the MySQL Adapter, see [raw execution](mysql#execute).

An Adapter without an `execute()` contract makes this method unavailable at the TypeScript call site.

## `database`

```typescript
database.database: string
```

Reads `adapter.getDBName()` every time. Toshihiko and Cache implementations use this value as the database namespace.

## `Toshihiko.createCache()`

```typescript
Toshihiko.createCache(source: unknown): Cache | null
```

Returns an existing Cache unchanged, creates one from a module-style configuration, or returns `null` when the value does not describe a Cache. See [Cache configuration](cache#cache-configuration).

## Related types

| Type | Purpose |
|---|---|
| `ToshihikoOptions` | Default open options type |
| `AdapterSource` | Dialect name, Adapter instance, or Adapter constructor |
| `AdapterConstructor` | Constructor accepted by `Toshihiko` |
| `ModelDefinitionOptions` | `cache` and contextually typed `methods` |
