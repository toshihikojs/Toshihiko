# Model usage

A Model is the entry point for building rows, starting queries, running bulk mutations, and managing Adapter transactions.

## Build a row

```typescript
const user = User.build({
  name: 'Alice',
  birthday: null,
});
```

The returned Yukari carries the Model schema and exposes `insert()`, `update()`, `delete()`, `save()`, validation, and JSON conversion.

## Start a query

The following methods create a new Query and return it:

```typescript
User.where({ name: 'Alice' });
User.orderBy({ id: 'desc' });
User.fields(['id', 'name']);
User.limit(20);
User.index('idx_users_name');
User.conn(connection);
```

Each chain is independent. Calling a query method on the Model never mutates a previous Query.

## Read rows

```typescript
const rows = await User.find();
const first = await User.findOne();
const byId = await User.findById(1);
const count = await User.where({ name: 'Alice' }).count();
```

`find()` returns an array by default. `{ single: true }` retains the 1.x single-row form:

```typescript
const first = await User.where({ name: 'Alice' }).find({ single: true });
```

Pass `true` to return plain JSON rows rather than Yukari objects.

## Bulk update and delete

```typescript
await User.where({ active: false }).update({ archived: true });
await User.where({ archived: true }).delete();
```

The concrete Adapter defines the mutation result type. Use a `where()` condition for bulk writes unless every row is intentionally targeted.

## Raw execution

`execute()` forwards its arguments to the configured Adapter:

```typescript
await database.execute(
  'UPDATE `users` SET `name` = ? WHERE `user_id` = ?',
  ['Alice', 1],
);
```

The MySQL Adapter accepts bound values and a transaction connection where its API documents one.

## Transactions

Transactions belong to the Adapter and are exposed through the Model:

```typescript
const connection = await User.beginTransaction();

try {
  const user = User.build({ name: 'Alice' });
  await user.insert(connection);
  await User.commit(connection);
} catch (error) {
  await User.rollback(connection);
  throw error;
}
```

Pass the connection through `conn()` for Queries and as the first argument of Yukari write methods. The MySQL Adapter releases the connection after commit or rollback.
