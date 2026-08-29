# MySQL Adapter API

`@toshihiko/mysql-adapter` implements the Adapter contract with the `mysql2/promise` pool.

```typescript
import {
  MySQLAdapter,
  MySQLSqlBuilder,
  type MySQLAdapterOptions,
} from '@toshihiko/mysql-adapter';
```

## `MySQLAdapter`

### Constructor

```typescript
new MySQLAdapter(options?)
new MySQLAdapter(parent, options)
```

Applications normally let Toshihiko use the second form:

```typescript
const database = new Toshihiko(MySQLAdapter, {
  database: 'app',
  host: '127.0.0.1',
  password: 'secret',
  user: 'root',
});
```

### Options

`MySQLAdapterOptions` extends `mysql2` `PoolOptions`, except that Toshihiko redeclares the following properties.

| Option | Type | Description |
|---|---|---|
| `database` | `string` | Database name and Cache namespace |
| `user` | `string` | MySQL username |
| `username` | `string` | Compatibility alias used when `user` is absent |
| `password` | `string` | MySQL password |
| `pool` | `Pool` | Existing `mysql2/promise` pool; skips pool creation |
| `showSql` | `false \| true \| ((sql: string) => void)` | Disabled, logs with `console.log`, or invokes a custom logger |
| `package` | `string` | Compatibility option; runtime driver remains `mysql2` |

### Properties

| Property | Type | Description |
|---|---|---|
| `database` | `string` | Normalized database name |
| `username` | `string` | Normalized user name |
| `mysql` | `Pool` | Promise pool |
| `package` | `'mysql2'` | Driver identifier |
| `format` | `(sql, values?) => string` | Pool-bound SQL formatter |
| `options` | `MySQLAdapterOptions` | Public copied options |

The owning Toshihiko instance exposes `database.pool` as the same pool.

## `execute()`

```typescript
adapter.execute(sql, values?): Promise<MySQLQueryResult>
adapter.execute(connection, sql, values?): Promise<MySQLQueryResult>

database.execute(sql, values?): Promise<MySQLQueryResult>
database.execute(connection, sql, values?): Promise<MySQLQueryResult>
query.execute(sql, values?): Promise<MySQLQueryResult>
```

`values` may be an array or an object. Array values use `connection.execute()` unless the SQL contains `??`; object values and `??` use `connection.query()`. When no connection is supplied, the pool executes the statement.

`showSql` receives the formatted SQL before execution.

## Query operations

| Method | Return type | Behavior |
|---|---|---|
| `find(query, options?)` | row, row array, or `null` | Uses Cache unless absent or `noCache` is true |
| `count(query)` | `Promise<number>` | Compiles `COUNT(0)` |
| `updateByQuery(query)` | `Promise<ResultSetHeader>` | Invalidates related Cache entries before execution |
| `deleteByQuery(query)` | `Promise<ResultSetHeader>` | Invalidates related Cache entries before execution |
| `insert(model, connection, data)` | `Promise<AdapterRow>` | Inserts and reads the row back |
| `update(model, connection, key, data)` | `Promise<ResultSetHeader>` | Uses original key values and rejects stale updates |

`insert()` rejects when the mutation result is absent or readback cannot find the inserted row. `update()` rejects empty locators, empty write data, and a result with no affected rows.

## Transactions

```typescript
adapter.beginTransaction(): Promise<MySQLConnection>
adapter.commit(connection): Promise<void>
adapter.rollback(connection): Promise<void>
```

`beginTransaction()` acquires a pool connection and releases it if transaction start fails. Both completion methods release the connection after the driver call succeeds.

## Cache-aware reads

```typescript
adapter.findWithNoCache(model, options?): Promise<AdapterRow | readonly AdapterRow[] | null>
adapter.findWithCache(cache, model, options?): Promise<AdapterRow | readonly AdapterRow[] | null>
```

The Cache path first selects primary keys, reads cached rows, loads misses with a concurrency limit, and then restores requested field selection.

## Compatibility SQL helpers

The Adapter exposes these public methods for existing integrations:

```typescript
makeFieldWhere(field, value): string
makeArrayWhere(model, values, logic?): string
makeWhere(model, where): string
makeOrder(model, order): string
makeLimit(model, limit): string
makeIndex(model, index?): string
makeSet(model, update): string
makeFind(model, options?): string
makeUpdate(model, options?): string
makeDelete(model, options?): string
makeSql(type, model, options?): string
```

They delegate to `MySQLSqlBuilder` and return formatted SQL strings.

## `MySQLSqlBuilder`

The builder exposes `make*()` string helpers and `compile*()` methods returning parameterized statements:

```typescript
interface MySQLStatement {
  readonly sql: string;
  readonly values: readonly unknown[];
}
```

Prefer `compileFind()`, `compileUpdate()`, `compileDelete()`, `compileWhere()`, and `compileSql()` when executing generated SQL. The `make*()` forms format values into a string and are mainly compatibility and inspection helpers.

## Exported types

| Type | Description |
|---|---|
| `MySQLAdapterOptions` | Pool and Toshihiko options |
| `MySQLConnection`, `MySQLPool` | `mysql2/promise` connection and pool |
| `MySQLQueryResult` | Driver query-result union |
| `MySQLMutationResult` | `ResultSetHeader` |
| `MySQLValues` | Array or named values |
| `MySQLExecuteArguments` | `Toshihiko.execute()` overload tuple |
| `MySQLQueryOptions` | SQL-builder input state |
| `MySQLStatement` | Parameterized SQL and values |
| `MySQLModel`, `MySQLQuery`, `MySQLField` | Adapter boundary contracts |
