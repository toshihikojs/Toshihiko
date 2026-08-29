# `Model`

Model 是 [`Toshihiko#define()`](toshihiko#define) 返回的表级 API。业务代码通常不直接构造 Model。

## 元数据

| 属性 | 说明 |
|---|---|
| `name` | `define()` 中的表名字面量 |
| `schema` | 编译后的 `Field[]` |
| `primaryKeys` | 标记为主键的字段 |
| `autoIncrementField` | 自增字段，没有时为 `null` |
| `nameToColumn`、`columnToName` | 逻辑字段名与存储列名映射 |
| `fieldNamesMap`、`fieldColumnsMap` | 字段名到编译后 Field 的映射 |
| `cache` | 当前 Model 使用的 Cache |
| `options` | `define()` 的 Model 配置 |

## `build()`

```typescript
Model.build(fields): BuiltYukari
```

创建尚未写入数据库的 [Yukari](yukari)。输入只能使用 Schema 字段。调用者提供的字段和带默认值的字段在返回类型中是已知属性，其余字段保持可选。

## 查询入口

每个方法都会创建新的 [Query](query)。

| 方法 | 作用 |
|---|---|
| `where(condition)` | 设置类型化条件 |
| `fields(fields)` | 选择字段 |
| `field(fields)` | `fields()` 的兼容别名 |
| `limit(count)`、`limit(offset, count)` | 设置条数与偏移 |
| `order(order)`、`orderBy(order)` | 设置排序 |
| `index(name)` | 设置数据库后端解释的索引提示 |
| `conn(connection)` | 绑定事务连接 |

## 读取

```typescript
Model.find(options?): Promise<readonly QueriedYukari[]>
Model.findOne(toJSON?): Promise<QueriedYukari | null>
Model.findById(id, toJSON?): Promise<QueriedYukari | null>
```

`find()` 与 [Query.find()](query#find) 具有相同重载。传入 `true` 会返回序列化后的普通对象。单主键 Model 可直接传主键值；联合主键应传对象。

```typescript
await User.findById(42);
await Membership.findById({ userId: 42, groupId: 7 });
```

## 写入、计数与原始执行

| 方法 | 返回值 |
|---|---|
| `count()` | `Promise<number>` |
| `update(data)` | 后端定义的批量更新结果 |
| `delete()` | 后端定义的批量删除结果 |
| `execute(...args)` | 后端定义的原始执行结果 |

`Model.update()` 与 `Model.delete()` 没有条件。除非确实要操作整张表，否则应先调用 `where()`。

## 事务

```typescript
Model.beginTransaction(): Promise<Connection>
Model.commit(connection): Promise<Result>
Model.rollback(connection): Promise<Result>
```

只有后端声明相应能力时，这些方法才可调用。连接类型来自所选后端。详见[事务](../transactions)。

## 自定义方法

`define(..., { methods })` 中的方法会复制到 Model，参数与返回类型均会保留。

```typescript
const User = database.define('users', schema, {
  methods: {
    async findActive() {
      return this.where({ active: true }).find();
    },
  },
});
```

## 辅助类型

`Model`、`ModelOptions`、`ModelDefinitionOptions`、`BuildInput`、`InferModelRow` 和 `InferModelPrimaryKey` 用于扩展与通用函数的类型声明。
