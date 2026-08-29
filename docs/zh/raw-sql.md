# 原始 SQL

Model 和 Query 无法表达某项数据库操作时，可以使用原始执行。应用数据应优先使用绑定参数。

```typescript
await database.execute(
  'SELECT * FROM `users` WHERE `user_id` = ?',
  [1],
);

await User.conn(connection).execute(
  'UPDATE `users` SET `name` = ? WHERE `user_id` = ?',
  ['Alice', 1],
);
```

MySQL Adapter 也支持把连接放在第一个参数：

```typescript
const adapter = database.getAdapter();
await adapter.execute('SELECT 1');
await adapter.execute(connection, 'SELECT ?', [1]);
```

## SQL 日志

```typescript
const database = new Toshihiko('mysql', {
  database: 'app',
  showSql: (sql) => console.log(sql),
});
```

Adapter 同时会为 SQL 触发 `sql` 事件，并在连接池创建连接时触发 `log` 事件。

## 原始表达式

MySQL 兼容层识别双花括号包裹的更新表达式：

```typescript
await Score.where({ id: 1 }).update({ value: '{{value + 1}}' });
```

原始表达式、排序字符串和索引名属于 SQL 结构，只能使用应用自身控制的字符串，不能拼入请求参数或其他不可信输入。
