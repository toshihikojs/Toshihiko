# `Toshihiko`

`Toshihiko` 配置一个数据库后端，并创建绑定到该后端的 Model。

```typescript
import { Toshihiko } from 'toshihiko';
```

## 构造函数

```typescript
new Toshihiko(adapter, options?)
```

| 参数 | 类型 | 说明 |
|---|---|---|
| `adapter` | 方言名、Adapter 构造函数或实例 | 选择数据库实现 |
| `options` | 由所选实现推断 | 数据库配置，并保存在 `database.options` |

```typescript
const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  username: 'root',
});
```

`'mysql'` 会加载 `@toshihiko/mysql-adapter`。以 `.`、`/` 或 `@` 开头的名称会按原样加载。Adapter 构造函数或实例主要用于依赖注入与扩展测试。

## 属性

| 属性 | 类型 | 说明 |
|---|---|---|
| `cache` | `Cache \| null \| undefined` | 数据库级 Cache |
| `database` | `string` | 当前数据库命名空间 |
| `dialect` | `string \| null` | 方言名或构造函数名 |
| `options` | 所选配置类型 | 构造配置 |
| `pool` | 后端专用连接池或 `undefined` | MySQL 兼容入口 |

Adapter 实例不是应用 API 的一部分。

## `define()`

```typescript
database.define(name, schema, options?)
```

创建 [Model](model)，并保留表名、字段名、字段值、可空性、主键和自定义方法的类型。

```typescript
const User = database.define('users', [
  { name: 'id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
], {
  methods: {
    async findByName(name: string) {
      return this.where({ name }).find();
    },
  },
});

await User.findByName('Yukari');
```

`methods` 应使用方法简写。这样 `this` 会被推断为 Model 与同一对象中的全部自定义方法；箭头函数没有这个 `this`。

## `execute()`

```typescript
database.execute(...args): Promise<Result>
```

执行所选数据库后端的原始操作。参数和返回类型由后端确定。MySQL 用法见[原始 SQL](../raw-sql)。

## `Toshihiko.createCache()`

```typescript
Toshihiko.createCache(source: unknown): Cache | null
```

已有 Cache 会原样返回；模块式配置会创建 Cache；无效输入返回 `null`。详见 [Cache API](cache)。
