# MySQL Adapter API

`@toshihiko/mysql-adapter` は `mysql2/promise` で Adapter 契約を実装します。設定と execute はアプリケーション向け、Query snapshot と SQL Builder は拡張開発者向けです。

## アプリケーション設定

```typescript
type MySQLValues =
  | readonly unknown[]
  | Readonly<Record<string, unknown>>;

type MySQLShowSql = false | true | ((sql: string) => void);

interface MySQLAdapterOptions extends Omit<
  PoolOptions,
  'database' | 'password' | 'user'
> {
  readonly [key: string]: unknown;
  readonly database?: string;
  readonly password?: string;
  readonly package?: string;
  readonly pool?: MySQLPool;
  readonly showSql?: MySQLShowSql;
  readonly user?: string;
  readonly username?: string;
}
```

```typescript
const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  password: 'secret',
  username: 'root',
});
```

| 設定 | 型 |
|---|---|
| `database` | `string \| undefined` |
| `user`、`username` | `string \| undefined` |
| `password` | `string \| undefined` |
| `pool` | `MySQLPool \| undefined` |
| `showSql` | `false \| true \| ((sql: string) => void) \| undefined` |
| `package` | `string \| undefined`。実行時 driver は常に `mysql2` |

アプリケーションは `database.execute()`、Model、Query、transaction API を使い、`MySQLAdapter` インスタンスを取得しません。

## Raw 実行

```typescript
type MySQLExecuteArguments =
  | readonly [sql: string, values?: MySQLValues]
  | readonly [
      connection: MySQLConnection | null,
      sql: string,
      values?: MySQLValues,
    ];

type MySQLQueryExecuteArguments = readonly [
  sql: string,
  values?: MySQLValues,
];

database.execute(
  ...args: MySQLExecuteArguments
): Promise<MySQLQueryResult>
query.execute(
  ...args: MySQLQueryExecuteArguments
): Promise<MySQLQueryResult>
```

配列値は通常 `execute()`、object 値または `??` を含む SQL は `query()` を使います。`showSql` は実行前に format 済み SQL を受け取ります。

## トランザクション

```typescript
const connection = await User.beginTransaction();
try {
  await User.conn(connection).execute('UPDATE ...', values);
  await User.commit(connection);
} catch (error) {
  await User.rollback(connection);
  throw error;
}
```

transaction start の失敗時、および commit / rollback 後には接続が契約どおり release されます。

## 拡張実装

`MySQLAdapter` は Adapter 開発者向けに `find()`、`count()`、`updateByQuery()`、`deleteByQuery()`、`insert()`、`update()` を公開します。これらは [Adapter Query snapshot](adapter#query-snapshot) または Model / Field データを受け取り、アプリケーションの mutable Query インスタンスは受け取りません。

```typescript
class MySQLAdapter extends Adapter<
  MySQLAdapterOptions,
  MySQLModel,
  MySQLConnection,
  MySQLField,
  unknown,
  MySQLQuery
> {
  readonly database: string;
  readonly mysql: MySQLPool;
  readonly package: 'mysql2';
  readonly username: string;
  readonly format: (sql: string, values?: MySQLValues) => string;

  find(query: MySQLQuery, options?: AdapterFindOptions):
    Promise<AdapterRow | readonly AdapterRow[] | null>;
  count(query: MySQLQuery): Promise<number>;
  updateByQuery(query: MySQLQuery): Promise<MySQLMutationResult>;
  deleteByQuery(query: MySQLQuery): Promise<MySQLMutationResult>;
  insert(model: MySQLModel, connection: MySQLConnection | null,
    data: readonly AdapterData<MySQLField, unknown>[]): Promise<AdapterRow>;
  update(model: MySQLModel, connection: MySQLConnection | null,
    primaryKey: Readonly<Record<string, unknown>>,
    data: readonly AdapterData<MySQLField, unknown>[]):
    Promise<MySQLMutationResult>;
  beginTransaction(): Promise<MySQLConnection>;
  commit(connection: MySQLConnection): Promise<void>;
  rollback(connection: MySQLConnection): Promise<void>;
}
```

`findWithCache()` は主キーを取得し、Cache hit を利用し、miss を並行で補完します。update と delete は SQL 実行前に関連する主キー Cache を無効化します。

## `MySQLSqlBuilder`

Parameterized method の公開 signature は次のとおりです。

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

実行には `compile*()` を優先してください。`make*()` は format 済み文字列を返し、主に互換と inspection に使います。

パッケージは `MySQLAdapterOptions`、`MySQLConnection`、`MySQLPool`、`MySQLQueryResult`、`MySQLMutationResult`、`MySQLValues`、`MySQLExecuteArguments`、`MySQLStatement` と、Adapter 境界の `MySQLModel`、`MySQLQuery`、`MySQLField` を export します。
