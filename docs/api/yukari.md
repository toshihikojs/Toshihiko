# `Yukari`

A Yukari is a row-level object. Schema fields become enumerable properties on the instance. Applications receive one from `Model.build()` or a query.

## Row forms

```typescript
type BuiltYukari<
  Name extends string,
  Schema extends SchemaDefinition,
  Input extends BuildInput<Schema>,
  AdapterInstance extends AdapterLike = Adapter,
> = Yukari<Name, Schema, AdapterInstance>
  & Omit<BuiltRowFromSchema<Schema, Input>, keyof Yukari<Name, Schema, AdapterInstance>>;

type QueriedYukari<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike = Adapter,
> = Yukari<Name, Schema, AdapterInstance>
  & Omit<Partial<RowFromSchema<Schema>>, keyof Yukari<Name, Schema, AdapterInstance>>;
```

## Lifecycle

A row created by `build()` is ready for `insert()` or `save()`. A row returned
by a query is ready for `update()`, `delete()`, or `save()`. Toshihiko keeps the
lifecycle and original-value snapshot private.

An inserted built row remains insertable for compatibility. Query it again
before calling `update()` or `delete()`.

## `validateOne()`

```typescript
validateOne<Field extends FieldName<RowFromSchema<Schema>>>(
  name: Field,
  value: RowFromSchema<Schema>[Field],
): Promise<void>
```

Runs the validators for one schema field. The field name and value are schema-typed.

It rejects when the field does not exist, a non-nullable field receives `null`, or a validator returns a non-empty string. Validators execute with `this` bound to the Model.

## `validateAll()`

```typescript
row.validateAll(): Promise<void>
```

Validates enumerable mapped fields on the instance. Up to ten fields are
validated concurrently. Functions and values not mapped to a schema field are
skipped.

## `insert()`

```typescript
insert(connection?: AdapterConnection<AdapterInstance> | null): Promise<this>
```

Validates the row, writes its mapped fields, and copies database-generated
values onto the same object.

Calling it on a queried row rejects.

## `update()`

```typescript
update(connection?: AdapterConnection<AdapterInstance> | null): Promise<this>
```

Compares current values with the private original snapshot, validates the row,
and updates using the original primary-key values. If no field has changed, the
complete mapped row is sent.

Calling it on a built row rejects. After a successful call, the original
snapshot is updated.

## `delete()`

```typescript
delete(connection?: AdapterConnection<AdapterInstance> | null): Promise<true>
```

Builds a one-row Query from original primary-key values. When no primary key
exists, all original fields form the locator.

Calling it on a built row rejects. A falsy database result also rejects.

## `save()`

```typescript
save(connection?: AdapterConnection<AdapterInstance> | null): Promise<this>
```

Calls `insert()` for a built Yukari and `update()` for a queried Yukari.

## `toJSON()`

```typescript
row.toJSON(useOriginalData?: boolean): Partial<JsonRowFromSchema<Schema>>
```

Serializes mapped fields with each Field Type's `toJSON()` function. With `useOriginalData: true`, it serializes the original snapshot instead of current properties.

```typescript
const current = user.toJSON();
const beforeChanges = user.toJSON(true);
```

## Related types

| Type | Purpose |
|---|---|
| `BuiltYukari` | Locally built row with input-sensitive field presence |
| `QueriedYukari` | Hydrated row with selected fields |
| `YukariFieldData` | Field/value pair passed across the Adapter boundary |
