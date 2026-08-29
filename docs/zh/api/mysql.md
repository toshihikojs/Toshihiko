# MySQL Adapter API

`@toshihiko/mysql-adapter` 使用 `mysql2/promise` 实现 Adapter 契约。本页的构造与执行部分适用于应用；查询快照和 SQL Builder 部分面向 Adapter 扩展开发者。

## 应用配置

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

```typescript
const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  password: 'secret',
  username: 'root',
});
```

| 配置 | 类型 | 默认值 | 说明 |
|---|---|---:|---|
| `database` | `string` | `'toshihiko'` | 数据库名和 Cache 命名空间 |
| `host` | `string` | `'localhost'` | MySQL 主机名或 IP |
| `port` | `number` | `3306` | MySQL 端口 |
| `user` | `string` | `''` | MySQL 用户名 |
| `username` | `string` | — | `user` 的兼容写法；同时提供时优先使用 |
| `password` | `string` | `''` | MySQL 密码 |
| `pool` | `MySQLPool` | — | 注入现有 Pool；省略时按其余配置创建 Pool |
| `showSql` | `false \| true \| ((sql: string) => void)` | `false` | SQL 日志开关或日志函数 |
| `cache` | `Cache \| CacheOptions` | — | 现有 Cache 实例，或包含 `module`、`path`、`name` 及其构造参数的[模块配置](cache#配置)；Model 默认继承 |
| `package` | `string` | — | 兼容字段；运行时驱动始终是 `mysql2` |
| 其他配置 | `mysql2.PoolOptions` | 由 `mysql2` 决定 | 原样传给 `mysql2.createPool()` |

`MySQLAdapterOptions` 继承 `mysql2` 的 `PoolOptions`，所以还可以设置 `connectionLimit`、`charset`、`ssl`、`connectTimeout` 等驱动配置。

业务代码通过 `database.execute()`、Model、Query 与事务方法工作，不需要取得 `MySQLAdapter` 实例。

## 原始执行

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

数组值通常使用 `execute()`；对象值或包含 `??` 的 SQL 使用 `query()`。`showSql` 会在执行前收到格式化 SQL。

## 事务

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

事务开始失败、提交或回滚结束后，连接都会按契约释放。

## 扩展实现

`MySQLAdapter` 为 Adapter 作者公开 `find()`、`count()`、`updateByQuery()`、`deleteByQuery()`、`insert()` 与 `update()`。它们接收 [Adapter Query 快照](adapter#query-快照) 或 Model/Field 数据，不接收应用的可变 Query 实例。

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

`findWithCache()` 会先读取主键、命中缓存并并发补齐 miss；更新与删除在执行 SQL 前使相关主键缓存失效。

## `MySQLSqlBuilder`

参数化方法的完整公开签名为：

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

执行 SQL 时应优先使用参数化的 `compile*()` 方法。`make*()` 方法返回格式化字符串，主要用于兼容和检查。

## 导出类型

软件包导出 `MySQLAdapterOptions`、`MySQLConnection`、`MySQLPool`、`MySQLQueryResult`、`MySQLMutationResult`、`MySQLValues`、`MySQLExecuteArguments`、`MySQLStatement`，以及 Adapter 边界所需的 `MySQLModel`、`MySQLQuery` 与 `MySQLField`。
