# Core concepts

Toshihiko uses four public concepts to describe a database operation. They are
different objects with different lifetimes:

| Concept | Represents | Created by |
|---|---|---|
| `Toshihiko` | One configured database entry point | `new Toshihiko(...)` |
| Model | One table and its field mapping | `database.define(...)` |
| Query | One mutable set of query conditions | `Model.where(...)` and the other query builders |
| Yukari | One record instance | `Model.build(...)` or a query result |

## What is Toshihiko?

The name has two related meanings in this documentation.

### Where the names come from

The project is named after [Himura Toshihiko, also called Yakumo
Toshihiko](https://baike.baidu.com/item/%E7%BB%AF%E6%9D%91%E4%BF%8A%E5%BD%A6/8900097),
a character from the Touhou fan work *Touhou Warring States Nights*. In that
character setting, Toshihiko becomes a *bunshin* of Yakumo Yukari when
Yukari's consciousness inhabits him.

That relationship is the reason the ORM calls a record object a **Yukari
instance**. It is a literal object instance in JavaScript, while the character
Toshihiko is himself a manifested instance, or avatar, of Yukari. `Yukari` is
therefore not a generic synonym for “row”; it is part of the character
reference built into the API.

**Toshihiko is the library and project.** It is a simple Node.js ORM with a
cache layer. An ORM maps database records to JavaScript objects. Toshihiko
handles CRUD around those records; it does not create or alter tables or
define relationships between them.

**`Toshihiko` is also the exported class.** An instance represents one
configured database entry point. It owns an Adapter, exposes the selected
database name, creates Models, can execute Adapter-level raw operations, and
can supply a Cache inherited by its Models.

```typescript
const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  username: 'root',
});
```

The string dialect form loads the matching scoped Adapter package. An Adapter
constructor or an already-created Adapter instance can be injected instead.

The instance is not a table and does not represent a row. Calling `define()`
creates the table-level Model; calling `build()` or running a query creates
row-level Yukari instances.

## Model

A Model maps one database table to a schema. The Model is also the starting
point for row construction, queries, transactions, and application-specific
Model methods.

```typescript
const User = database.define('users', [
  { name: 'id', column: 'user_id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
]);
```

`name` is the logical property used by application code. `column` is the
physical database column and defaults to `name`.

## Query

Calling `where()`, `orderBy()`, `fields()`, `limit()`, `index()`, or `conn()` on
a Model creates a Query. Query methods mutate that Query and return it so calls
can be chained.

```typescript
const query = User
  .where({ name: { $like: 'A%' } })
  .orderBy({ id: 'desc' })
  .limit(20);

const users = await query.find();
```

Create a new chain when you need an independent query state.

## Yukari

A Yukari is a record instance. The name refers back to Toshihiko being
Yukari's *bunshin* in the character setting; in the ORM, it is one concrete
object representing one row under a particular Model. Its mapped fields are
ordinary writable properties, while the object also retains the Model, schema,
Adapter, source state, and, for queried rows, an original data snapshot.

```typescript
const newUser = User.build({ name: 'Alice' });
await newUser.insert();

const queriedUser = await User.findById(1);
if (queriedUser) {
  queriedUser.name = 'Bob';
  await queriedUser.update();
}
```

`build()` creates a new-source Yukari for insertion. Query methods create a
query-source Yukari whose original snapshot is used for change detection and
as the update or delete locator. An inserted built Yukari remains new-source,
so query it before calling
`update()` or `delete()`.

The Model and Yukari therefore play roles similar to a table and a row:
`User.findById()` is a Model operation, while `user.save()` is a Yukari
operation. See [Yukari instances](yukari.md) for the complete lifecycle.

## Adapter

The Adapter owns database-specific behavior: connection pools, SQL generation,
bound values, transactions, and driver results. The core expresses operations
through a typed Adapter contract without assuming a particular driver.

Use `database.getAdapter()` when application code needs the concrete Adapter
type:

```typescript
const adapter = database.getAdapter();
```

## Cache

A Cache implements four Promise operations: get data, set data, delete one key,
and delete a list of keys. A Model can inherit the database Cache, replace it,
or disable it.

Cache behavior also depends on the Adapter. The MySQL Adapter integrates query
reads and mutation invalidation with the cache packages in this repository.

## Type flow

The Model schema supplies the types for build input, query conditions,
primary-key values, Yukari properties, and JSON output.

Custom Field Types can define different database, application, and JSON value
types. Those types flow through the same graph.

## Next

- [Define a Model](model/definition.md)
- [Run queries](querying.md)
- [Understand Yukari rows](yukari.md)
