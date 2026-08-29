# 使用 Model

Model 是构造 Yukari 和创建 Query 的入口。

## 构造数据行

```typescript
const user = User.build({ name: 'Alice' });
```

输入字段必须属于 Schema，字段值、默认值和可选性由 Schema 推导。

## 创建 Query

```typescript
User.where({ id: { $gte: 1 } });
User.fields(['id', 'name']);
User.orderBy({ id: 'desc' });
User.limit(20);
User.index('idx_users_name');
User.conn(connection);
```

每次从 Model 开始都会创建新的 Query；后续 Query 方法修改同一个实例。

## 读取

```typescript
const users = await User.find();
const user = await User.findOne();
const byId = await User.findById(1);
const json = await User.findById(1, true);
const count = await User.count();
```

多行查询返回数组，单行查询返回 Yukari 或 `null`。传 `true` 会立即返回普通 JSON 对象。

## 批量更新与删除

```typescript
await User.where({ active: false }).update({ archived: true });
await User.where({ archived: true }).delete();
```

这些方法作用于 Query 表示的行集合，与单个 Yukari 的 `update()`、`delete()` 不同。返回值由具体 Adapter 定义。

## 原始执行与事务

```typescript
await User.execute('SELECT 1');

const connection = await User.beginTransaction();
try {
  await User.where({ id: 1 }).conn(connection).update({ name: 'Alice' });
  await User.commit(connection);
} catch (error) {
  await User.rollback(connection);
  throw error;
}
```

参见[事务](../transactions.md)和[原始 SQL](../raw-sql.md)。
