# MySQL Adapter API

`@toshihiko/mysql-adapter` は `mysql2/promise` で Adapter 契約を実装します。設定と execute はアプリケーション向け、Query snapshot と SQL Builder は拡張開発者向けです。

## アプリケーション設定

```typescript
const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  password: 'secret',
  username: 'root',
});
```

| 設定 | 説明 |
|---|---|
| `database` | データベース名と Cache 名前空間 |
| `user`、`username` | MySQL ユーザー名。後者は互換エイリアス |
| `password` | MySQL パスワード |
| `pool` | 既存 Promise Pool |
| `showSql` | `false`、`true`、または SQL logger |
| `package` | 互換設定。実行時 driver は常に `mysql2` |

アプリケーションは `database.execute()`、Model、Query、transaction API を使い、`MySQLAdapter` インスタンスを取得しません。

## Raw 実行

```typescript
database.execute(sql, values?): Promise<MySQLQueryResult>
database.execute(connection, sql, values?): Promise<MySQLQueryResult>
query.execute(sql, values?): Promise<MySQLQueryResult>
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

`findWithCache()` は主キーを取得し、Cache hit を利用し、miss を並行で補完します。update と delete は SQL 実行前に関連する主キー Cache を無効化します。

## `MySQLSqlBuilder`

`compileFind()`、`compileUpdate()`、`compileDelete()`、`compileWhere()`、`compileSql()` は次の parameterized statement を返します。

```typescript
interface MySQLStatement {
  readonly sql: string;
  readonly values: readonly unknown[];
}
```

実行には `compile*()` を優先してください。`make*()` は format 済み文字列を返し、主に互換と inspection に使います。

パッケージは `MySQLAdapterOptions`、`MySQLConnection`、`MySQLPool`、`MySQLQueryResult`、`MySQLMutationResult`、`MySQLValues`、`MySQLExecuteArguments`、`MySQLStatement` と、Adapter 境界の `MySQLModel`、`MySQLQuery`、`MySQLField` を export します。
