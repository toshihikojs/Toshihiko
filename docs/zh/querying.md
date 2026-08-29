# 查询

Query 方法可链式调用，字段名和值会根据 Model Schema 检查。

## 条件

```typescript
User.where({
  id: { $gte: 10 },
  name: { $like: 'A%' },
});
```

| 操作符 | 含义 |
|---|---|
| `$eq`、`===` | 等于 |
| `$neq`、`!==` | 不等于 |
| `$gt`、`>` | 大于 |
| `$gte`、`>=` | 大于等于 |
| `$lt`、`<` | 小于 |
| `$lte`、`<=` | 小于等于 |
| `$in` | 位于值数组中 |
| `$between` | 位于两个值之间 |
| `$like` | SQL `LIKE` |
| `$and` | AND 组合 |
| `$or` | OR 组合 |

```typescript
User.where({
  $or: [{ name: 'Alice' }, { name: 'Bob' }],
  active: true,
});
```

MySQL Adapter 将值作为绑定参数传递；排序字符串、索引名和原始表达式属于 SQL 结构，只能来自可信应用代码。

## 排序、字段和限制

```typescript
User.orderBy({ id: 'desc', name: 'asc' });
User.order('id DESC');
User.fields(['id', 'name']);
User.limit(20);
User.limit(40, 20);
User.limit([40, 20]);
User.limit('40,20');
```

数值排序方向使用 `1` 表示升序，`-1` 表示降序。`field()` 是 `fields()` 的别名。

## 索引与连接

```typescript
User.index('idx_users_name');
User.conn(connection);
```

`index()` 设置 Adapter 特定的强制索引；`conn()` 将 Query 绑定到已有连接，通常用于事务。

## 返回形式

```typescript
await User.find();
await User.find({ noCache: true });
await User.find({ single: true });
await User.find(true, { noCache: true });
await User.findOne(true);
```

`single` 返回单个 Yukari 或 `null`，`noCache` 仅绕过本次查询的缓存读取，布尔参数控制 JSON 转换。

Query 保存可变状态。复用 Query 会保留之前的条件和设置；需要独立条件时重新从 Model 开始。
