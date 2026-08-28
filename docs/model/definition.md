# Model definition

Models map a table or collection name to a list of fields:

```typescript
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
    defaultValue: 'anonymous',
  },
]);
```

## Field options

| Option | Meaning |
|---|---|
| `name` | Property name used by Models, Queries, and Yukari objects. Required. |
| `column` | Database column name. Defaults to `name`. |
| `type` | Field type. Defaults to `Type.String`. |
| `primaryKey` | Marks the field as part of the primary key. Composite keys are supported. |
| `autoIncrement` | Marks the database-generated field used during insert readback. |
| `allowNull` | Adds `null` to the inferred value type and permits null validation. |
| `defaultValue` | Value copied into new Yukari objects when the field is omitted. |
| `validators` | One validator or an array of validators, run in declaration order. |

Snake case option names from 1.x remain accepted at runtime for JavaScript callers, but TypeScript code should use the names above.

## Primary keys

Primary keys drive `findById()`, update locators, delete locators, and cache keys.

For one primary key, pass its value directly:

```typescript
await User.findById(1);
```

For a composite primary key, pass an object:

```typescript
const Membership = database.define('memberships', [
  { name: 'userId', column: 'user_id', type: Type.Integer, primaryKey: true },
  { name: 'teamId', column: 'team_id', type: Type.Integer, primaryKey: true },
  { name: 'role', type: Type.String },
]);

await Membership.findById({ userId: 1, teamId: 2 });
```

Models without primary keys can still run queries, but row writes and cache lookup lose their reliable locator. Prefer an explicit primary key.

## Defaults

Built-in types may provide defaults. `Type.String`, `Type.Integer`, `Type.Float`, `Type.Boolean`, and `Type.Json` do; `Type.Datetime` does not. A field-level `defaultValue` overrides the type default.

Defaults are deep-cloned into each new Yukari object, so mutable JSON defaults are not shared between rows.

## Validators

A validator receives the typed field value. It may return a message, return nothing, or return a Promise of either result:

```typescript
const Score = database.define('scores', [
  {
    name: 'value',
    type: Type.Integer,
    validators: async (value) => {
      if (value < 0) return 'score must not be negative';
    },
  },
]);
```

A non-empty message becomes an `Error`. `validateAll()`, `insert()`, and `update()` wait for asynchronous validators.

## Model options and cache inheritance

The optional third argument configures one Model:

```typescript
const Audit = database.define('audit', auditSchema, {
  cache: false,
});
```

A Model inherits the Toshihiko-level cache when `cache` is omitted. Pass a cache instance to replace it, or `false` or `null` to disable caching for that Model.

## Inferred helper types

Most application code can use `build()` directly. Helper types remain available when a row type must cross a module boundary:

```typescript
import type { InferModelPrimaryKey, InferModelRow } from 'toshihiko';

type UserRow = InferModelRow<typeof User>;
type UserPrimaryKey = InferModelPrimaryKey<typeof User>;
```
