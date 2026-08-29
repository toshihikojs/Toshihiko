# 从 v1 升级

Toshihiko v2 是对 v1 的 TypeScript 重构。升级重点是软件包结构和异步语法，然后再按需采用类型；Model、Query 和 Yukari 仍是原来的概念。

## 环境与软件包

升级到 Node.js 22 或 24，并安装 scoped Adapter：

```bash
npm install toshihiko@next @toshihiko/mysql-adapter@next
```

| v1 | v2 |
|---|---|
| `toshihiko` | `toshihiko` |
| 内置 MySQL 依赖 | `@toshihiko/mysql-adapter` |
| `toshihiko-redis` | `@toshihiko/redis-cache` |
| `toshihiko-memcached` | `@toshihiko/memcached-cache` |
| 自定义 Adapter 基类 | `@toshihiko/base-adapter` |
| 自定义 Cache 基类 | `@toshihiko/base-cache` |

安装 MySQL Adapter 后，原来的 `mysql` dialect 字符串仍可使用。

## Model 与 Promise

`define(table, fields, options)` 形状保持不变。JavaScript 运行时继续归一化 v1 字段别名；TypeScript 应使用 `primaryKey`、`autoIncrement`、`allowNull` 和 `defaultValue`。

```typescript
const users = await User.where({ name: 'Alice' }).find();
await User.build({ name: 'Bob' }).insert();
```

Validator 可以直接返回消息，也可以返回消息的 Promise。

## 自定义 Model 方法

JavaScript 仍可直接赋值：

```javascript
User.findByName = function findByName(name) {
  return this.where({ name }).findOne();
};
```

TypeScript 应放入 `methods`，从而推断外部调用和方法内的 `this`：

```typescript
const User = database.define('users', userSchema, {
  methods: {
    findByName(name: string) {
      return this.where({ name }).findOne();
    },
  },
});
```

## Yukari 生命周期与 Cache

`build()` 创建新 Yukari，`insert()` 后仍保持新行语义。更新或删除前重新查询。Cache 建议直接构造 scoped 包实例，再放入 Toshihiko 选项；v1 模块形式仍保留 JavaScript 运行时兼容。

## 核对清单

- 字段与列映射、复合主键和自增回读；
- 查询操作符、链式调用和返回形式；
- Yukari 插入、更新、删除、保存、验证和 JSON；
- 原始执行与事务连接参数；
- Redis、Memcached 的 key、hit、miss 与失效；
- 动态 Model 方法和自定义 Field Type。

仓库回归测试覆盖公开 v1 行为，但不能代替应用对自定义 Adapter、Cache 和原始 SQL 的集成测试。
