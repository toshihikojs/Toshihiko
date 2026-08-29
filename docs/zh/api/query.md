# `Query`

Query 描述一次数据库操作。构建方法会修改当前 Query，并返回同一个实例。需要两组独立状态时，应分别从 Model 开始调用链。

## `where()`

```typescript
query.where(condition: QueryWhere<Row>): this
```

替换当前条件，不会与上一次调用合并。

```typescript
User.where({
  $or: [
    { name: { $like: 'A%' } },
    { id: { $between: [10, 20] } },
  ],
});
```

支持 `$eq`、`$neq`、`$gt`、`$gte`、`$lt`、`$lte`、`$between`、`$in`、`$like`、`$and` 与 `$or`，并保留 `===`、`!==`、`>`、`>=`、`<`、`<=` 兼容写法。非对象条件会同步抛错。

## 字段、排序、限制与连接

```typescript
query.fields(fields): this
query.field(fields): this
query.order(order): this
query.orderBy(order): this
query.limit(count): this
query.limit(offset, count): this
query.index(name): this
query.conn(connection): this
```

`field()` 与 `orderBy()` 是兼容别名。数组形式的字段和对象形式的排序能够获得字段名检查。`conn()` 绑定由 `beginTransaction()` 返回的连接。

## `find()`

```typescript
find(): Promise<readonly QueriedYukari[]>
find({ single: true }): Promise<QueriedYukari | null>
find(true): Promise<readonly QueryJsonRow[]>
find({ single: true }, true): Promise<QueryJsonRow | null>
```

| 选项 | 默认值 | 作用 |
|---|---:|---|
| `toJSON` | `false` | 返回普通序列化对象 |
| `single` | `false` | 只取一条，不存在时返回 `null` |
| `noCache` | `false` | 本次读取跳过缓存 |

布尔值与选项对象支持兼容的参数顺序；字面量 `true` 会参与返回类型推断。

## `findOne()` 与 `findById()`

```typescript
findOne(toJSON?): Promise<Row | null>
findById(id, toJSON?): Promise<Row | null>
```

联合主键使用对象。无主键或联合主键 Model 收到原始值时会抛错。缓存读取失败会回退到数据库。

## 计数与写入

```typescript
query.count(): Promise<number>
query.update(data: Partial<Row>): Promise<Result>
query.delete(): Promise<Result>
query.execute(...args): Promise<Result>
```

`update()` 与 `delete()` 使用当前条件、排序和限制。`execute()` 使用 `conn()` 绑定的连接。具体结果类型由数据库后端推断。

## 相关类型

`QueryWhere<Row>`、`QueryFieldOperators<Value>`、`QueryOrder<Row>`、`QueryFindOptions`、`QueryJsonRow<Schema>` 与 `FindByIdInput<Schema>` 描述公开查询接口。
