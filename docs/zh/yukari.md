# Yukari 数据行

Yukari 是绑定到 Model 的一行数据。这个名字来自项目的人设：Toshihiko 是八云紫（Yakumo Yukari）的分身，也就是 Yukari 在另一具身体上的“实例”；ORM 中的一条记录同样会成为一个具体的对象实例，所以 API 把它命名为 `Yukari`。

每个 Yukari 都记住自己来自本地构造、数据库查询还是已经删除。完整命名背景参见[核心概念](concepts.md#toshihiko-与-yukari-的名字从哪里来)。

## 构造与插入

```typescript
const user = User.build({ name: 'Alice', birthday: null });
await user.insert();
```

`insert()` 验证当前字段，通过 Field Type 恢复存储值，调用 Adapter，并把自增 ID 等回读值写回同一对象。插入不会把新 Yukari 变成查询 Yukari。

## 更新

```typescript
const found = await User.findById(1);
if (found) {
  found.name = 'Updated Alice';
  await found.update();
}
```

查询 Yukari 保存原始快照。`update()` 比较当前值与快照，并以原始主键定位记录；成功后刷新快照。

## 删除与保存

```typescript
if (found) await found.delete();

await User.build({ name: 'Alice' }).save(); // insert
if (found) await found.save();              // update
```

新 Yukari 不能直接 `update()` 或 `delete()`；删除后的 Yukari 不应继续用于写入。

## 验证

```typescript
await user.validateOne('name', user.name);
await user.validateAll();
```

只有声明 `allowNull: true` 的字段允许 `null`。Validator 返回的非空消息会变成错误。

## JSON 转换

```typescript
const current = user.toJSON();
const original = found?.toJSON(true);
```

默认序列化当前字段；`true` 序列化查询时的原始快照。Field Type 控制 `Date` 等值的 JSON 形式。
