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

```typescript
type MySQLValues = readonly unknown[] | Readonly<Record<string, unknown>>;
type MySQLShowSql = false | true | ((sql: string) => void);

interface MySQLAdapterOptions extends Omit<
  PoolOptions,
  'database' | 'password' | 'user'
> {
  readonly [key: string]: unknown;
  readonly cache?: CacheSource;
  readonly database?: string;
  readonly password?: string;
  readonly package?: string;
  readonly pool?: MySQLPool;
  readonly showSql?: MySQLShowSql;
  readonly user?: string;
  readonly username?: string;
}
```

| Option | Type | Default | Description |
|---|---|---:|---|
| `database` | `string` | `'toshihiko'` | Database name and Cache namespace |
| `host` | `string` | `'localhost'` | MySQL host name or IP address |
| `port` | `number` | `3306` | MySQL port |
| `user` | `string` | `''` | MySQL user name |
| `username` | `string` | — | Compatibility spelling for `user`; wins when both are present |
| `password` | `string` | `''` | MySQL password |
| `pool` | `MySQLPool` | — | Injects an existing Pool; omitting it creates one from the other options |
| `showSql` | `false \| true \| ((sql: string) => void)` | `false` | SQL logging switch or logger function |
| `cache` | `CacheSource` | — | Toshihiko-level Cache inherited by Models |
| `package` | `string` | — | Compatibility field; runtime driver remains `mysql2` |
| Other options | `mysql2.PoolOptions` | Set by `mysql2` | Passed to `mysql2.createPool()` |

Because `MySQLAdapterOptions` extends `mysql2` `PoolOptions`, it also accepts driver settings such as `connectionLimit`, `charset`, `ssl`, and `connectTimeout`.

### Properties

| Property | Type | Description |
|---|---|---|
| `database` | `string` | Normalized database name |
| `username` | `string` | Normalized user name |
| `mysql` | `Pool` | Promise pool |
| `package` | `'mysql2'` | Driver identifier |
| `format` | `(sql: string, values?: MySQLValues) => string` | Pool-bound SQL formatter |
| `options` | `MySQLAdapterOptions` | Public copied options |

The owning Toshihiko instance exposes `database.pool` as the same pool.

## `execute()`

```typescript
type MySQLExecuteArguments =
  | readonly [sql: string, values?: MySQLValues]
  | readonly [connection: MySQLConnection | null, sql: string, values?: MySQLValues];

type MySQLQueryExecuteArguments = readonly [sql: string, values?: MySQLValues];

adapter.execute(...args: MySQLExecuteArguments): Promise<MySQLQueryResult>
database.execute(...args: MySQLExecuteArguments): Promise<MySQLQueryResult>
query.execute(...args: MySQLQueryExecuteArguments): Promise<MySQLQueryResult>
```

`values` may be an array or an object. Array values use `connection.execute()` unless the SQL contains `??`; object values and `??` use `connection.query()`. When no connection is supplied, the pool executes the statement.

`showSql` receives the formatted SQL before execution.

## Query operations

| Method | Return type | Behavior |
|---|---|---|
| `find(query: MySQLQuery, options?: AdapterFindOptions)` | `Promise<AdapterRow \| readonly AdapterRow[] \| null>` | Uses Cache unless absent or `noCache` is true |
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
adapter.findWithNoCache(model: MySQLModel, options?: MySQLQueryOptions): Promise<AdapterRow | readonly AdapterRow[] | null>
adapter.findWithCache(cache: NonNullable<MySQLModel['cache']>, model: MySQLModel, options?: MySQLQueryOptions): Promise<AdapterRow | readonly AdapterRow[] | null>
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

compileFieldWhere(model: MySQLModel, key: string, condition: unknown, logic?: string): MySQLStatement
compileArrayWhere(model: MySQLModel, condition: readonly Readonly<Record<string, unknown>>[], logic?: string): MySQLStatement
compileWhere(model: MySQLModel, condition: Readonly<Record<string, unknown>> | readonly Readonly<Record<string, unknown>>[], logic?: string): MySQLStatement
compileSet(model: MySQLModel, update: Readonly<Record<string, unknown>>): MySQLStatement
compileValue(field: MySQLField, value: unknown): MySQLStatement
compileFind(model: MySQLModel, options?: MySQLQueryOptions): MySQLStatement
compileUpdate(model: MySQLModel, options?: MySQLQueryOptions): MySQLStatement
compileDelete(model: MySQLModel, options?: MySQLQueryOptions): MySQLStatement
compileSql(type: string, model: MySQLModel, options?: MySQLQueryOptions): MySQLStatement
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
