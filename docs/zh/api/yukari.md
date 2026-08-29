# `Yukari`

Yukari 是行级对象。Schema 字段会成为实例上可枚举、可直接读写的属性。它来自 `Model.build()` 或查询结果。

## 两种行类型

| 类型 | 来源 | 字段是否存在 |
|---|---|---|
| `BuiltYukari` | `Model.build(input)` | 输入字段和默认字段已知，其余可选 |
| `QueriedYukari` | `find()`、`findOne()`、`findById()` | 选择字段在静态类型中为可选 |

## 生命周期

`build()` 创建的行用于 `insert()` 或 `save()`；查询返回的行用于 `update()`、`delete()` 或 `save()`。生命周期和原始值快照由 Toshihiko 私下维护，不属于应用 API。

为保持原有行为，插入后的 built row 仍按可插入对象处理。需要更新或删除时，应重新查询该行。

## 校验

```typescript
row.validateOne(name, value): Promise<void>
row.validateAll(): Promise<void>
```

`validateOne()` 校验一个字段；字段名和值受 Schema 类型约束。字段不存在、不可空字段收到 `null`、或校验器返回非空字符串时会拒绝。

`validateAll()` 校验实例上的映射字段，最多并发处理十个字段。

## 持久化

```typescript
row.insert(connection?): Promise<this>
row.update(connection?): Promise<this>
row.delete(connection?): Promise<true>
row.save(connection?): Promise<this>
```

- `insert()` 校验并写入 built row，并把数据库生成值复制回当前对象。
- `update()` 比较当前值与内部原始快照，使用原始主键定位记录。
- `delete()` 使用原始主键删除一条记录；无主键时使用原始字段定位。
- `save()` 对 built row 执行插入，对查询行执行更新。

在错误生命周期调用方法会拒绝；数据库返回失败结果时也会保留错误。

## `toJSON()`

```typescript
row.toJSON(useOriginalData?: boolean): Partial<JsonRowFromSchema<Schema>>
```

使用各 Field Type 的 `toJSON()` 序列化映射字段。传入 `true` 会序列化修改前的原始快照。

```typescript
const current = user.toJSON();
const beforeChanges = user.toJSON(true);
```

## 相关类型

`BuiltYukari` 与 `QueriedYukari` 是应用层行类型；`YukariFieldData` 仅供 Adapter 扩展契约使用。
