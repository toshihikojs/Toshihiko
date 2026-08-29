# Raw SQL

Use raw execution when a database operation cannot be expressed through Model
or Query methods. Prefer bound values for application data.

## Execute from Toshihiko

```typescript
const result = await database.execute(
  'SELECT * FROM `users` WHERE `user_id` = ?',
  [1],
);
```

`database.execute()` forwards its arguments to the concrete Adapter and keeps
that Adapter's result type.

## Execute from a Model or Query

```typescript
await User.execute(
  'UPDATE `users` SET `name` = ? WHERE `user_id` = ?',
  ['Alice', 1],
);

await User
  .conn(connection)
  .execute('DELETE FROM `users` WHERE `user_id` = ?', [1]);
```

Model execution starts a Query. Calling `.conn(connection)` sends the command
through that existing Adapter connection.

## Execute on a transaction connection

The MySQL backend accepts an optional connection as the first argument. Obtain
it through the Model transaction API; application code does not need the
Adapter instance.

```typescript
const connection = await User.beginTransaction();
try {
  await User.conn(connection).execute('SELECT ?', [1]);
  await User.commit(connection);
} catch (error) {
  await User.rollback(connection);
  throw error;
}
```

The returned Promise resolves with the `mysql2` query result used by the
selected overload.

## SQL logging

Set `showSql` to `true` or to a listener:

```typescript
const database = new Toshihiko('mysql', {
  database: 'app',
  showSql: (sql) => console.log(sql),
});
```

The Adapter also emits a `sql` event for statements and a `log` event when the
pool creates a connection.

## Trusted raw expressions

The MySQL compatibility layer recognizes update expressions wrapped in double
braces:

```typescript
await Score.where({ id: 1 }).update({
  value: '{{value + 1}}',
});
```

Raw expressions and raw ordering strings are SQL structure, not bound values.
Only use application-owned strings. Never place request parameters, form input,
or other untrusted data inside them.

## Escaping helpers

`@toshihiko/sql-utils` exports `escape()` and `escapeLike()` for manual string
construction. Parameter binding remains the preferred way to pass values.

```typescript
import { escapeLike } from '@toshihiko/sql-utils';

const pattern = `%${escapeLike(searchText)}%`;
```

## Related pages

- [Transactions](transactions.md)
- [MySQL package](packages.md#toshihiko-mysql-adapter)
