# Adapter API

An Adapter translates Toshihiko Model, Query, Field, and row operations into a database-specific implementation. The core package exports the structural contract; `@toshihiko/base-adapter` exports a reusable class.

## Core contract

```typescript
interface Adapter<
  Model = unknown,
  Connection = unknown,
  Field = unknown,
  Value = unknown,
  Query extends AdapterQuery<Model, Connection> = AdapterQuery<Model, Connection>,
> {
  find(query: Query, options?: AdapterFindOptions): Promise<AdapterFindResult>;
  count(query: Query): Promise<number>;
  insert(
    model: Model,
    connection: Connection | null,
    data: readonly AdapterData<Field, Value>[],
  ): Promise<AdapterRow | null>;
  update(
    model: Model,
    connection: Connection | null,
    primaryKey: Readonly<Record<string, unknown>>,
    data: readonly AdapterData<Field, Value>[],
  ): Promise<unknown>;
  deleteByQuery(query: Query): Promise<unknown>;
  getDBName(): string;

  updateByQuery?(query: Query): Promise<unknown>;
  execute?(...args: readonly unknown[]): Promise<unknown>;
  beginTransaction?(): Promise<Connection>;
  commit?(connection: Connection): Promise<unknown>;
  rollback?(connection: Connection): Promise<unknown>;
}
```

Optional methods become callable from the corresponding core facade only when the concrete Adapter declares them.

## Shared data contracts

### `AdapterFindOptions`

```typescript
interface AdapterFindOptions {
  readonly noCache: boolean;
  readonly single: boolean;
}
```

### Rows and write data

```typescript
type AdapterRow = Readonly<Record<string, unknown>>;

interface AdapterData<Field, Value> {
  readonly field: Field;
  readonly value: Value;
}

type AdapterFindResult = AdapterRow | readonly AdapterRow[] | null;
```

An Adapter should return storage-column names in raw rows. Core hydration asks each Field to parse those values.

## Base `Adapter` class

```typescript
import { Adapter } from '@toshihiko/base-adapter';
```

```typescript
class ExampleAdapter extends Adapter<
  Options,
  Model,
  Connection,
  Field,
  Value,
  Query
> {}
```

The base class itself is declared as:

```typescript
class Adapter<
  Options extends object = DefaultAdapterOptions,
  Model = unknown,
  Connection = unknown,
  Field = unknown,
  Value = unknown,
  Query extends AdapterQuery<Model, Connection> = AdapterQuery<Model, Connection>,
> extends EventEmitter2 implements AdapterContract<
  Model,
  Connection,
  Field,
  Value,
  Query
>
```

### Constructor

```typescript
new Adapter(options?)
new Adapter(parent, options)
```

Toshihiko uses the second form. The standalone form is useful in Adapter tests. Options are copied before being stored in `adapter.options`; the owning Toshihiko instance is available as `adapter.parent` when supplied.

### Default methods

The base class implements every operation. Except for `getDBName()`, the default implementation returns a Promise that rejects on the next tick with a not-implemented error. `getDBName()` returns an empty string.

Concrete Adapters should override every operation they claim to support.

## `extend()`

```typescript
extend(defaults?, options?): Merge<Defaults, Options>
```

Deep-clones both sides and fills missing option values from defaults. Explicit option values take precedence. The returned type recursively combines both object shapes.

```typescript
const options = extend(
  { host: '127.0.0.1', pool: { size: 10 } },
  { pool: { size: 20 } },
);
```

## Typed raw execution

Adapters may declare `AdapterExecuteSpec<Arguments, QueryArguments, Result>` on the exported `adapterExecuteSpec` symbol. Core then uses:

- `Arguments` for `Toshihiko.execute()`;
- `QueryArguments` for `Query.execute()`;
- `Result` for both return types.

This is preferable when `Query.execute()` omits a connection argument that `Toshihiko.execute()` accepts.

## Transaction contract

`beginTransaction()` determines the connection type. `Model.commit()` and `Model.rollback()` accept that exact type and preserve the Adapter's result types.

An implementation that acquires a pooled connection should release it after commit or rollback, including begin failures where appropriate.

## Adapter type utilities

| Type | Extracts |
|---|---|
| `AdapterModel<Instance>` | Model accepted by `insert()` |
| `AdapterConnection<Instance>` | Non-null connection accepted by writes |
| `AdapterField<Instance>` | Field in `AdapterData` |
| `AdapterValue<Instance>` | Value in `AdapterData` |
| `AdapterQueryType<Instance>` | Query accepted by `find()` |
| `AdapterExecuteArguments<Instance>` | Toshihiko raw execution arguments |
| `AdapterQueryExecuteArguments<Instance>` | Query raw execution arguments |
| `AdapterExecuteResult<Instance>` | Raw execution result |
| `AdapterTransactionConnection<Instance>` | Result of `beginTransaction()` |

See [Writing extensions](../extensions) for a complete implementation example.
