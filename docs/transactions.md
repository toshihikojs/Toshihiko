# Transactions

Transactions are provided by the configured Adapter. The MySQL Adapter checks
out one pool connection and uses it until commit or rollback releases it.

## Complete transaction

```typescript
const connection = await User.beginTransaction();

try {
  const user = User.build({ name: 'Alice' });
  await user.insert(connection);

  await User
    .where({ name: 'Alice' })
    .conn(connection)
    .update({ name: 'Committed Alice' });

  await User.commit(connection);
} catch (error) {
  await User.rollback(connection);
  throw error;
}
```

`beginTransaction()`, `commit()`, and `rollback()` are also available from the
concrete Adapter. The Model methods keep the Adapter-specific connection type,
so TypeScript rejects connections created by an unrelated Adapter.

## Use one connection everywhere

Pass the transaction connection to every operation that belongs to the
transaction:

| Operation | Connection form |
|---|---|
| Query read, count, update, delete, execute | `.conn(connection)` |
| Yukari insert, update, delete, save | Method argument |
| Adapter raw execution | First Adapter argument |

```typescript
const connection = await User.beginTransaction();

try {
  const row = await User.where({ id: 1 }).conn(connection).findOne();
  if (row) {
    row.name = 'Transactional update';
    await row.update(connection);
  }
  await User.commit(connection);
} catch (error) {
  await User.rollback(connection);
  throw error;
}
```

Starting a transaction does not implicitly bind later Model calls. A query that
does not receive the connection may run on another pool connection outside the
transaction.

## Commit and rollback

For the MySQL Adapter, both successful commit and successful rollback release
the checked-out connection. Errors from the driver are propagated. Keep the
rollback in the failure path and rethrow the original application error after
cleanup.

## Adapter support

Transaction methods only type-check when the Adapter contract implements them.
The base Adapter methods reject as not implemented until a concrete Adapter
overrides them.

## Related pages

- [Raw SQL](raw-sql.md)
- [Yukari writes](yukari.md)
- [Model API](model/usage.md)
