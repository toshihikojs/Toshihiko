# MySQL Adapter API

`@toshihiko/mysql-adapter` 使用 `mysql2/promise` 实现 Adapter 契约。本页的构造与执行部分适用于应用；查询快照和 SQL Builder 部分面向 Adapter 扩展开发者。

## 应用配置

```typescript
const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  password: 'secret',
  username: 'root',
});
```

| 配置 | 说明 |
|---|---|
| `database` | 数据库名与 Cache 命名空间 |
| `user`、`username` | MySQL 用户名，后者为兼容别名 |
| `password` | MySQL 密码 |
| `pool` | 已有的 Promise Pool |
| `showSql` | `false`、`true` 或 SQL 日志函数 |
| `package` | 兼容配置；运行时驱动仍为 `mysql2` |

业务代码通过 `database.execute()`、Model、Query 与事务方法工作，不需要取得 `MySQLAdapter` 实例。

## 原始执行

```typescript
database.execute(sql, values?): Promise<MySQLQueryResult>
database.execute(connection, sql, values?): Promise<MySQLQueryResult>
query.execute(sql, values?): Promise<MySQLQueryResult>
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

`findWithCache()` 会先读取主键、命中缓存并并发补齐 miss；更新与删除在执行 SQL 前使相关主键缓存失效。

## `MySQLSqlBuilder`

`compileFind()`、`compileUpdate()`、`compileDelete()`、`compileWhere()` 与 `compileSql()` 返回：

```typescript
interface MySQLStatement {
  readonly sql: string;
  readonly values: readonly unknown[];
}
```

执行 SQL 时应优先使用参数化的 `compile*()` 方法。`make*()` 方法返回格式化字符串，主要用于兼容和检查。

## 导出类型

软件包导出 `MySQLAdapterOptions`、`MySQLConnection`、`MySQLPool`、`MySQLQueryResult`、`MySQLMutationResult`、`MySQLValues`、`MySQLExecuteArguments`、`MySQLStatement`，以及 Adapter 边界所需的 `MySQLModel`、`MySQLQuery` 与 `MySQLField`。
