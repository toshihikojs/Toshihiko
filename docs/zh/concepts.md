# 核心概念

Toshihiko 用四个公开概念描述一次数据库操作。它们是生命周期不同的对象：

| 概念 | 代表什么 | 如何创建 |
|---|---|---|
| `Toshihiko` | 一个配置好的数据库入口 | `new Toshihiko(...)` |
| Model | 一张表及其字段映射 | `database.define(...)` |
| Query | 一组可继续修改的查询条件 | `Model.where(...)` 等查询构造方法 |
| Yukari | 一条记录的对象实例 | `Model.build(...)` 或查询结果 |

## Toshihiko 是什么

文档中的 Toshihiko 有两个相关的含义。

### Toshihiko 与 Yukari 的名字从哪里来

项目名来自东方同人作品《东方战国夜》中的[绯村俊彦，也就是八云俊彦](https://baike.baidu.com/item/%E7%BB%AF%E6%9D%91%E4%BF%8A%E5%BD%A6/8900097)。在人设中，绯村俊彦被八云紫（Yakumo Yukari）的意识附体，成为她的分身八云俊彦。

这层关系正是 ORM 把一条记录叫作 **Yukari instance** 的原因。代码里，它确实是 JavaScript 的一个对象实例；人设里，Toshihiko 自身也是 Yukari 的一个分身，也就是她在另一具身体上的“实例”。所以 `Yukari` 不是随手给“数据行”换的名字：Toshihiko 中的每个 record instance 叫 Yukari，呼应 Toshihiko 本身就是 Yukari 的分身。

**Toshihiko 是项目和软件包的名字。** 它是一个带缓存层的简单 Node.js ORM。ORM 在数据库记录和 JavaScript 对象之间做映射。Toshihiko 负责这些记录周围的 CRUD，不负责创建或修改表结构，也不定义表关系。

**`Toshihiko` 也是软件包导出的类。** `new Toshihiko(...)` 创建一个配置好的数据库入口。这个实例持有 Adapter、暴露当前数据库名、创建 Model、执行 Adapter 提供的原始操作，并可向 Model 提供 Cache。

```typescript
const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  username: 'root',
});
```

字符串形式会加载对应的 scoped Adapter 包；也可以直接注入 Adapter 构造函数或实例。

这个实例本身不是表，也不代表某一行。调用 `define()` 后得到代表表的 Model；调用 `build()` 或执行查询后，才会得到代表数据行的 Yukari。

## Model

Model 将一张数据库表映射为一份 Schema，也是构造数据行、发起查询、使用事务和定义业务方法的入口。

```typescript
const User = database.define('users', [
  { name: 'id', column: 'user_id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
]);
```

`name` 是业务代码使用的逻辑属性，`column` 是物理列名；省略 `column` 时使用 `name`。

## Query

在 Model 上调用 `where()`、`orderBy()`、`fields()`、`limit()`、`index()` 或 `conn()` 会创建 Query。Query 配置方法修改并返回同一个 Query，因此可以链式调用。

```typescript
const users = await User
  .where({ name: { $like: 'A%' } })
  .orderBy({ id: 'desc' })
  .limit(20)
  .find();
```

需要独立查询状态时，应从 Model 开始新的调用链。

## Yukari

Yukari 是 record instance。这个名字呼应 Toshihiko 是 Yukari 分身的人设；在 ORM 里，一个 Yukari 则是某个 Model 下代表一行数据的具体对象实例。映射字段是可以直接读写的普通属性；对象内部还保留 Model、Schema、Adapter、来源状态，以及查询数据的原始快照。

```typescript
const row = await User.findById(1);
if (row) {
  row.name = 'Bob';
  await row.update();
}
```

`build()` 创建来源为 `new` 的 Yukari，用于插入；查询创建来源为 `query` 的 Yukari，原始快照用于判断改动，并在更新或删除时定位记录。由 `build()` 创建的 Yukari 在插入后仍是 `new`，调用 `update()` 或 `delete()` 前应重新查询。

因此，Model 与 Yukari 可以分别理解为表级对象和行级对象：`User.findById()` 是 Model 操作，`user.save()` 是 Yukari 操作。完整状态变化参见 [Yukari 数据行](yukari.md)。

## Adapter 与 Cache

Adapter 负责连接池、SQL、绑定参数、事务和驱动返回值。Cache 提供读取、写入、删除单键和批量删除四个 Promise 操作。Model 可以继承、替换或禁用数据库级 Cache，具体缓存路径由 Adapter 落地。

## 类型流

Model Schema 同时决定 `build()` 输入、`where()` 条件、`findById()` 主键、Yukari 属性与 JSON 输出。自定义 Field Type 可以分别描述存储值、应用值和 JSON 值，并沿同一条链路传播。

## 下一步

- [定义 Model](model/definition.md)
- [运行查询](querying.md)
- [理解 Yukari](yukari.md)
