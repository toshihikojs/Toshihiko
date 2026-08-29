# `Query`

A Query is a mutable description of one database operation. Model query-entry methods create it; builder methods modify it and return the same instance.

```typescript
const query = User.where({ active: true });
query === query.limit(20); // true
```

Start again from the Model when two independent query configurations are needed.

```typescript
class Query<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike = Adapter,
>
```

## `where()`

```typescript
where(condition: QueryWhere<RowFromSchema<Schema>>): this
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
fields(fields: string | readonly FieldName<RowFromSchema<Schema>>[]): this
field(fields: string | readonly FieldName<RowFromSchema<Schema>>[]): this
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
order(order: QueryOrder<RowFromSchema<Schema>>): this
orderBy(order: QueryOrder<RowFromSchema<Schema>>): this
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
conn(connection: AdapterConnection<AdapterInstance> | null): this
```

Binds a typed transaction connection. Passing `null` returns execution to the
database backend's default connection behavior.

## `find()`

```typescript
find(): Promise<readonly QueriedYukari<Name, Schema, AdapterInstance>[]>
find(options: QueryFindManyOptions): Promise<readonly QueriedYukari<Name, Schema, AdapterInstance>[]>
find(options: QueryFindOneOptions): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
find(toJSON: false, options?: QueryFindManyOptions): Promise<readonly QueriedYukari<Name, Schema, AdapterInstance>[]>
find(toJSON: false, options: QueryFindOneOptions): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
find(toJSON: true, options?: QueryFindManyOptions): Promise<readonly QueryJsonRow<Schema>[]>
find(toJSON: true, options: QueryFindOneOptions): Promise<QueryJsonRow<Schema> | null>
find(options: QueryFindManyOptions, toJSON: true): Promise<readonly QueryJsonRow<Schema>[]>
find(options: QueryFindOneOptions, toJSON: false): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
find(options: QueryFindOneOptions, toJSON: true): Promise<QueryJsonRow<Schema> | null>
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
findOne(): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
findOne(toJSON: false): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
findOne(toJSON: true): Promise<QueryJsonRow<Schema> | null>
```

Equivalent to a single-result find without `noCache`.

## `findById()`

```typescript
findById(id: FindByIdInput<Schema>): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
findById(id: FindByIdInput<Schema>, toJSON: false): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
findById(id: FindByIdInput<Schema>, toJSON: true): Promise<QueryJsonRow<Schema> | null>
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
update(data: Partial<RowFromSchema<Schema>>): Promise<AdapterUpdateByQueryResult<AdapterInstance>>
```

Sets the data for the current bulk update. It is unavailable at the TypeScript
call site when the selected backend does not declare bulk update support.

### `delete()`

```typescript
delete(): Promise<AdapterDeleteByQueryResult<AdapterInstance>>
```

Deletes rows matching the current Query.

### `execute()`

```typescript
execute(...args: AdapterQueryExecuteArguments<AdapterInstance>): Promise<AdapterExecuteResult<AdapterInstance>>
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
