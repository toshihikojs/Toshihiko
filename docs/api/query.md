# `Query`

A Query is a mutable description of one database operation. Model query-entry methods create it; builder methods modify it and return the same instance.

```typescript
const query = User.where({ active: true });
query === query.limit(20); // true
```

Start again from the Model when two independent query configurations are needed.

## `where()`

```typescript
query.where(condition: QueryWhere<Row>): this
```

Replaces the current condition. It does not merge with an earlier call.

```typescript
User.where({
  $or: [
    { name: { $like: 'A%' } },
    { id: { $between: [10, 20] } },
  ],
});
```

### Operators

| Operator | Value |
|---|---|
| `$eq`, `===` | one field value |
| `$neq`, `!==` | one field value |
| `$gt`, `>`, `$gte`, `>=` | one field value |
| `$lt`, `<`, `$lte`, `<=` | one field value |
| `$between` | two-value tuple |
| `$in` | value array |
| `$like` | Adapter-defined pattern value |
| `$and`, `$or` | one value or value array; top-level forms also accept condition objects |

Passing a non-object value throws synchronously.

## `fields()` and `field()`

```typescript
query.fields(fields: string | readonly FieldName[]): this
query.field(fields: string | readonly FieldName[]): this
```

`field()` is a compatibility alias. A string is split on commas and trimmed. An array receives schema field-name checking; a string remains available for compatible expressions.

Passing a runtime value that is neither a string nor an array throws synchronously.

## `limit()`

```typescript
query.limit(count: number | string | readonly (number | string)[]): this
query.limit(offset: number | string, count: number | string): this
```

Strings and arrays are compatibility forms. Values are parsed with `parseInt()`; values that cannot be parsed become `0`. At most two array entries are retained.

## `order()` and `orderBy()`

```typescript
query.order(order: QueryOrder<Row>): this
query.orderBy(order: QueryOrder<Row>): this
```

`orderBy()` is an alias of `order()`. Prefer the object form for field-name checking.

```typescript
query.orderBy({ createdAt: 'desc', id: 'ASC' });
query.order('createdAt DESC, id ASC');
```

Directions accept numbers or `asc`, `ASC`, `desc`, and `DESC`. String directions other than `ASC` normalize to descending order.

## `index()`

```typescript
query.index(name: string): this
```

Stores an index hint. Interpretation belongs to the selected database backend.

## `conn()`

```typescript
query.conn(connection: AdapterConnection | null): this
```

Binds a typed transaction connection. Passing `null` returns execution to the
database backend's default connection behavior.

## `find()`

```typescript
find(): Promise<readonly QueriedYukari[]>
find(options: { single?: false; noCache?: boolean }): Promise<readonly QueriedYukari[]>
find(options: { single: true; noCache?: boolean }): Promise<QueriedYukari | null>

find(false, options?): Promise<readonly QueriedYukari[]>
find(false, { single: true }): Promise<QueriedYukari | null>
find(true, options?): Promise<readonly QueryJsonRow[]>
find(true, { single: true }): Promise<QueryJsonRow | null>

find(options, true): Promise<readonly QueryJsonRow[] | QueryJsonRow | null>
```

### Arguments

| Argument | Default | Effect |
|---|---:|---|
| `toJSON` | `false` | Returns serialized plain objects instead of Yukari rows |
| `options.single` | `false` | Requests one result and returns `null` when absent |
| `options.noCache` | `false` | Tells the Adapter to bypass query caching |

The boolean and options object may appear in either supported order. The literal values `true` and `single: true` drive the return type.

## `findOne()`

```typescript
findOne(): Promise<QueriedYukari | null>
findOne(false): Promise<QueriedYukari | null>
findOne(true): Promise<QueryJsonRow | null>
```

Equivalent to a single-result find without `noCache`.

## `findById()`

```typescript
findById(id): Promise<QueriedYukari | null>
findById(id, false): Promise<QueriedYukari | null>
findById(id, true): Promise<QueryJsonRow | null>
```

For one primary key, `id` may be the field value. Composite keys require an object. A primitive passed to a Model with zero or multiple primary keys throws.

When a Cache is configured, `findById()` first calls `cache.getData(database, table, condition)`. Cache read errors are ignored and fall back to the Adapter.

## Executing writes and counts

### `count()`

```typescript
query.count(): Promise<number>
```

Counts rows matching the current Query.

### `update()`

```typescript
query.update(data: Partial<Row>): Promise<AdapterUpdateByQueryResult>
```

Sets the data for the current bulk update. It is unavailable at the TypeScript
call site when the selected backend does not declare bulk update support.

### `delete()`

```typescript
query.delete(): Promise<AdapterDeleteByQueryResult>
```

Deletes rows matching the current Query.

### `execute()`

```typescript
query.execute(...args): Promise<AdapterExecuteResult>
```

Runs a raw operation with the connection selected by `conn()`. Arguments and
result follow the selected backend.

## Related types

| Type | Purpose |
|---|---|
| `QueryWhere<Row>` | Recursive, field-aware conditions |
| `QueryFieldOperators<Value>` | Operators available for one field |
| `QueryOrder<Row>` | String, object, or array ordering forms |
| `QueryFindOptions` | `single` and `noCache` flags |
| `QueryFindManyOptions` | Options with `single?: false` |
| `QueryFindOneOptions` | Options with `single: true` |
| `QueryJsonRow<Schema>` | Partial serialized row |
| `FindByIdInput<Schema>` | Primary-key lookup input |
