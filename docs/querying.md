# Querying

Query methods are chainable. TypeScript checks logical field names and values against the Model schema.

## Conditions

Pass an object to `where()`:

```typescript
User.where({
  id: { $gte: 10 },
  name: { $like: 'A%' },
});
```

The supported comparison operators are:

| Operator | Meaning |
|---|---|
| `$eq`, `===` | Equal |
| `$neq`, `!==` | Not equal |
| `$gt`, `>` | Greater than |
| `$gte`, `>=` | Greater than or equal |
| `$lt`, `<` | Less than |
| `$lte`, `<=` | Less than or equal |
| `$in` | Included in an array of values |
| `$between` | Between a two-value tuple |
| `$like` | SQL `LIKE` comparison |
| `$and` | Combine conditions with `AND` |
| `$or` | Combine conditions with `OR` |

Logical groups can be nested:

```typescript
User.where({
  $or: [
    { name: 'Alice' },
    { name: 'Bob' },
  ],
  active: true,
});
```

Values are passed to the MySQL driver as bound parameters. Query structure, identifiers, index names, and trusted raw expressions still belong to application code.

## Ordering

Use an object, a SQL order string, or an array combining them:

```typescript
User.orderBy({ id: 'desc', name: 'asc' });
User.order('id DESC');
User.order([{ active: -1 }, { name: 1 }]);
```

Numeric directions use `1` for ascending and `-1` for descending.

## Fields

Select fields with a comma-separated string or an array:

```typescript
User.fields('id,name');
User.fields(['id', 'name']);
```

`field()` is an alias of `fields()`.

## Limits

```typescript
User.limit(20);        // LIMIT 20
User.limit(40, 20);    // LIMIT 40, 20
User.limit([40, 20]);  // LIMIT 40, 20
User.limit('40,20');   // LIMIT 40, 20
```

## Indexes and connections

```typescript
User.index('idx_users_name');
User.conn(connection);
```

`index()` selects the Adapter-specific forced index. `conn()` sends the Query through an existing Adapter connection, usually a transaction connection.

## Find options

```typescript
await User.find();
await User.find({ noCache: true });
await User.find({ single: true });
await User.find(true, { noCache: true });
```

`single` returns one Yukari or `null`. `noCache` bypasses cache reads for that query. The boolean argument controls JSON conversion.

`findOne()` is the direct single-row helper:

```typescript
const row = await User.where({ active: true }).findOne();
const json = await User.where({ active: true }).findOne(true);
```
