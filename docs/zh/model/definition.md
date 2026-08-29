# 定义 Model

Model 将表名映射为字段列表，并以这份 Schema 作为运行时映射和 TypeScript 推断的共同来源。

```typescript
const User = database.define('users', [
  {
    name: 'id',
    column: 'user_id',
    type: Type.Integer,
    primaryKey: true,
    autoIncrement: true,
  },
  { name: 'name', type: Type.String, defaultValue: 'anonymous' },
]);
```

## 字段选项

| 选项 | 含义 |
|---|---|
| `name` | Model、Query 和 Yukari 使用的逻辑属性名，必填。 |
| `column` | 数据库列名，默认等于 `name`。 |
| `type` | Field Type，默认是 `Type.String`。 |
| `primaryKey` | 标记主键，支持复合主键。 |
| `autoIncrement` | 标记插入后用于回读的数据库生成字段。 |
| `allowNull` | 允许验证 `null`，并将 `null` 加入推断类型。 |
| `defaultValue` | `build()` 缺少该字段时复制的默认值。 |
| `validators` | 一个或多个按顺序执行的 Validator。 |

JavaScript 运行时会归一化 snake_case 别名；TypeScript 应使用上表中的 camelCase 名称。

## 主键

单主键可以直接传值：

```typescript
await User.findById(1);
```

复合主键使用对象：

```typescript
const Membership = database.define('memberships', [
  { name: 'userId', column: 'user_id', type: Type.Integer, primaryKey: true },
  { name: 'teamId', column: 'team_id', type: Type.Integer, primaryKey: true },
  { name: 'role', type: Type.String },
]);

await Membership.findById({ userId: 1, teamId: 2 });
```

无主键 Model 仍可查询，但更新、删除和缓存缺少稳定定位条件，应优先声明主键。

## 默认值与 Validator

字段默认值覆盖类型默认值，且每次 `build()` 都会深拷贝可变默认值。

```typescript
const Score = database.define('scores', [{
  name: 'value',
  type: Type.Integer,
  defaultValue: 0,
  validators: async (value) => {
    if (value < 0) return 'score must not be negative';
  },
}]);
```

非空字符串会变成 `Error`。`validateAll()`、`insert()` 和 `update()` 都会等待异步 Validator。

## 自定义 Model 方法

```typescript
const User = database.define('users', userSchema, {
  methods: {
    findByName(name: string) {
      return this.where({ name }).findOne();
    },
    findByNameTwice(name: string) {
      return Promise.all([this.findByName(name), this.findByName(name)]);
    },
  },
});
```

`this` 会推断为完整 Model 和全部自定义方法。使用方法简写或普通 `function`；需要动态 `this` 时不要使用箭头函数。JavaScript 仍可在 `define()` 后直接挂载方法，但这种赋值无法改变 TypeScript 已推断的变量类型。

## Model 选项与 Cache

Model 默认继承 Toshihiko 级 Cache。传入 Cache 实例可覆盖；传 `false` 或 `null` 可禁用。

```typescript
const Audit = database.define('audit', auditSchema, { cache: false });
```

## 辅助类型

```typescript
import type { InferModelPrimaryKey, InferModelRow } from 'toshihiko';

type UserRow = InferModelRow<typeof User>;
type UserPrimaryKey = InferModelPrimaryKey<typeof User>;
```
