# `Toshihiko`

`Toshihiko` 表示一个已经配置好的数据库入口。应用通常只创建一个实例，再通过它定义 Model。

## 创建实例

使用 TypeScript 时，推荐直接传入 Adapter 类。这样构造参数会按 Adapter 的配置类型检查。

```typescript
import { Toshihiko } from 'toshihiko';
import { MySQLAdapter } from '@toshihiko/mysql-adapter';

const database = new Toshihiko(MySQLAdapter, {
  database: 'app',
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  password: 'secret',
});
```

也可以直接使用较短的方言名；`'mysql'` 会加载 `@toshihiko/mysql-adapter`。

```typescript
const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  username: 'root',
});
```

### MySQL 配置

传入官方 MySQL Adapter 时，`options` 是 `MySQLAdapterOptions`。常用字段如下。

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---:|---|
| `database` | `string` | `'toshihiko'` | 数据库名，也是 Cache 的数据库命名空间 |
| `host` | `string` | `'localhost'` | MySQL 主机名或 IP |
| `port` | `number` | `3306` | MySQL 端口 |
| `user` | `string` | `''` | MySQL 用户名 |
| `username` | `string` | — | `user` 的兼容写法；同时提供时使用 `username` |
| `password` | `string` | `''` | MySQL 密码 |
| `pool` | `MySQLPool` | — | 复用现有的 `mysql2/promise` Pool；省略时创建新 Pool |
| `showSql` | `false \| true \| ((sql: string) => void)` | `false` | `true` 使用 `console.log`；函数会收到格式化后的 SQL |
| `cache` | `CacheSource` | — | 数据库级 Cache；所有 Model 默认继承 |
| 其他字段 | [`mysql2.PoolOptions`](https://sidorares.github.io/node-mysql2/zh-CN/docs/examples/connections/create-pool) | 由 `mysql2` 决定 | 例如 `connectionLimit`、`charset`、`ssl` 和超时设置 |

完整的 MySQL 专用配置见 [MySQL Adapter API](mysql#应用配置)。其他 Adapter 决定各自的 `options` 结构。

### 构造参数

| 参数 | 可传入的值 | 说明 |
|---|---|---|
| `adapter` | 方言名、Adapter 类或 Adapter 实例 | 选择数据库实现；传类时 TypeScript 能检查对应配置 |
| `options` | 所选 Adapter 的配置对象 | 传给 Adapter，同时保存在 `database.options` |

传入已经构造好的 Adapter 实例时，不再传 `options`。

```typescript
const adapter = new MySQLAdapter({ database: 'app' });
const database = new Toshihiko(adapter);
```

## 属性

| 属性 | 应用中看到的类型 | 内容 |
|---|---|---|
| `database` | `string` | Adapter 当前连接的数据库名 |
| `dialect` | `string \| null` | 方言名；传入实例时通常是 Adapter 类名 |
| `options` | 所选 Adapter 的配置对象 | 构造时传入的原始配置 |
| `cache` | `Cache \| null \| undefined` | 当前数据库级 Cache |
| `pool` | MySQL 时为 `MySQLPool`，其他 Adapter 为 `undefined` | MySQL 连接池兼容入口 |

## `define()`

```typescript
database.define(name, schema, options?)
```

| 参数 | 类型 | 说明 |
|---|---|---|
| `name` | `string` | 表名；字符串字面量会保留在 Model 类型中 |
| `schema` | `readonly FieldDefinition[]` | 字段名、Field Type、列名、主键、默认值和 Validator |
| `options.cache` | `CacheSource \| false \| null` | 替换或关闭从数据库继承的 Cache |
| `options.methods` | 方法对象 | 方法复制到 Model；参数和返回类型原样保留 |

```typescript
const User = database.define('users', [
  { name: 'id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
], {
  cache: false,
  methods: {
    async findByName(name: string) {
      return this.where({ name }).find();
    },
  },
});

const users = await User.findByName('Yukari');
```

返回的 Model 会从 `schema` 推导字段名、字段值、可空性、主键和 JSON 类型。`methods` 应使用方法简写或普通 `function`，这样其中的 `this` 才能推导为完整 Model。

## `execute()`

原始执行参数和返回值由 Adapter 决定。官方 MySQL Adapter 提供以下形式：

```typescript
database.execute(
  sql: string,
  values?: MySQLValues,
): Promise<MySQLQueryResult>

database.execute(
  connection: MySQLConnection | null,
  sql: string,
  values?: MySQLValues,
): Promise<MySQLQueryResult>
```

`MySQLValues` 是只读数组或以名称为键的只读对象。详见[原始 SQL](../raw-sql)。

## `Toshihiko.createCache()`

```typescript
Toshihiko.createCache(source: unknown): Cache | null
```

已有 Cache 会原样返回；模块式配置会创建 Cache；无法识别的输入返回 `null`。业务代码通常直接构造 Cache，模块式配置主要用于兼容。详见 [Cache API](cache)。

## Adapter 开发者使用的泛型

业务代码不需要手写以下泛型。它们用于让自定义 Adapter 把配置、连接和执行结果传到 Model 与 Query。

```typescript
class Toshihiko<
  AdapterInstance extends AdapterLike = Adapter,
  Options extends object = ToshihikoOptions,
> extends EventEmitter2

type AdapterSource<Options extends object, Instance extends AdapterLike> =
  | string
  | Instance
  | AdapterConstructor<Options, Instance>;
```
