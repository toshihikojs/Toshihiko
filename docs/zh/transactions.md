# 事务

事务由具体 Adapter 提供。MySQL Adapter 从连接池取出一个连接，并在 commit 或 rollback 后释放。

```typescript
const connection = await User.beginTransaction();

try {
  await User.build({ name: 'Alice' }).insert(connection);
  await User.where({ id: 1 }).conn(connection).update({ name: 'Bob' });
  await User.commit(connection);
} catch (error) {
  await User.rollback(connection);
  throw error;
}
```

事务不会自动绑定后续 Model 调用。属于同一事务的所有操作都必须显式接收连接：Query 使用 `.conn(connection)`，Yukari 写入把连接作为方法参数，Adapter 原始执行把连接放在第一个参数。

连接类型来自具体 Adapter，TypeScript 会阻止把其他 Adapter 的连接传入。只有 Adapter 实现事务方法时，这些调用才可用；Base Adapter 的默认实现会以未实现错误失败。

参见[原始 SQL](raw-sql.md)和[Yukari 数据行](yukari.md)。
