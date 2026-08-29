# `Toshihiko`

`Toshihiko` 配置一个数据库后端，并创建绑定到该后端的 Model。

```typescript
import { Toshihiko } from 'toshihiko';
```

## 构造函数

```typescript
class Toshihiko<
  AdapterInstance extends AdapterLike = Adapter,
  Options extends object = ToshihikoOptions,
> extends EventEmitter2 {
  constructor(
    adapter: AdapterSource<Options, AdapterInstance>,
    ...options: {} extends Options
      ? readonly [options?: Options]
      : readonly [options: Options]
  );
}
```

| 参数 | 类型 | 说明 |
|---|---|---|
| `adapter` | `AdapterSource<Options, AdapterInstance>` | 方言名、Adapter 构造函数或实例 |
| `options` | `Options` | 数据库配置，并保存在 `database.options`；当 `Options` 有必填项时不可省略 |

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
| `options` | `Options` | 构造配置 |
| `pool` | `AdapterInstance extends { readonly mysql: infer Pool } ? Pool : undefined` | MySQL 兼容入口 |

Adapter 实例不是应用 API 的一部分。

## `define()`

```typescript
define<
  const Name extends string,
  const Schema extends SchemaDefinition,
  const Methods extends object = object,
>(
  collectionName: Name,
  schema: Schema,
  options?: ModelDefinitionOptions<
    Name,
    Schema,
    AdapterInstance,
    Methods
  >,
): Model<Name, Schema, AdapterInstance> & Methods
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
execute(
  ...args: AdapterExecuteArguments<AdapterInstance>
): Promise<AdapterExecuteResult<AdapterInstance>>
```

执行所选数据库后端的原始操作。参数和返回类型由后端确定。MySQL 用法见[原始 SQL](../raw-sql)。

## `Toshihiko.createCache()`

```typescript
static createCache(source: unknown): Cache | null
```

```typescript
Toshihiko.createCache(source: unknown): Cache | null
```

已有 Cache 会原样返回；模块式配置会创建 Cache；无效输入返回 `null`。详见 [Cache API](cache)。

## 相关类型

```typescript
interface AdapterConstructor<Options extends object, Instance extends AdapterLike> {
  new (parent: Toshihiko<Instance, Options>, options: Options): Instance;
}

type AdapterSource<Options extends object, Instance extends AdapterLike> =
  | string
  | Instance
  | AdapterConstructor<Options, Instance>;
```

`AdapterExecuteArguments` 与 `AdapterExecuteResult` 从具体 Adapter 提取原始执行参数和结果；`ModelDefinitionOptions` 描述 `cache` 与带上下文 `this` 的 `methods`。
