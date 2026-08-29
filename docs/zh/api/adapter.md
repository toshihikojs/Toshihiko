# Adapter API

本页面向数据库 Adapter 开发者。使用现成 Adapter 的业务代码只需通过 `new Toshihiko(...)` 选择后端，不应依赖 Adapter 实例或查询内部状态。

## 核心契约

```typescript
interface Adapter<
  Model = unknown,
  Connection = unknown,
  Field = unknown,
  Value = unknown,
  Query extends AdapterQuery<Model, Connection> = AdapterQuery<Model, Connection>,
> {
  find(query: Query, options?: AdapterFindOptions): Promise<AdapterFindResult>;
  count(query: Query): Promise<number>;
  insert(model: Model, connection: Connection | null,
    data: readonly AdapterData<Field, Value>[]): Promise<AdapterRow | null>;
  update(model: Model, connection: Connection | null,
    primaryKey: Readonly<Record<string, unknown>>,
    data: readonly AdapterData<Field, Value>[]): Promise<unknown>;
  deleteByQuery(query: Query): Promise<unknown>;
  getDBName(): string;

  updateByQuery?(query: Query): Promise<unknown>;
  execute?(...args: readonly unknown[]): Promise<unknown>;
  beginTransaction?(): Promise<Connection>;
  commit?(connection: Connection): Promise<unknown>;
  rollback?(connection: Connection): Promise<unknown>;
}
```

只有具体 Adapter 声明了可选方法时，对应的 Model 或 Query 方法才可在 TypeScript 中调用。

## Query 快照

核心交给 Adapter 的不是公开 `Query` 实例，而是只读快照：

```typescript
interface AdapterQuery<Model, Connection, Cache> {
  readonly cache: Cache;
  readonly connection: Connection | null;
  readonly fields: readonly string[];
  readonly index: string;
  readonly limit: readonly number[];
  readonly model: Model;
  readonly order: readonly Readonly<Record<string, number>>[];
  readonly updateData: Readonly<Record<string, unknown>>;
  readonly where: Readonly<Record<string, unknown>>;
}
```

这些名称是扩展契约，不会作为应用 Query 的可读写属性暴露。

## 行与写入数据

```typescript
type AdapterRow = Readonly<Record<string, unknown>>;
interface AdapterData<Field, Value> {
  readonly field: Field;
  readonly value: Value;
}
type AdapterFindResult = AdapterRow | readonly AdapterRow[] | null;
```

Adapter 返回的原始行应使用存储列名；核心会调用 Field 解析并生成 Yukari。

## 基础类

```typescript
import { Adapter } from '@toshihiko/base-adapter';

class ExampleAdapter extends Adapter<
  Options,
  Model,
  Connection,
  Field,
  Value,
  Query
> {}
```

基础类本身的声明为：

```typescript
class Adapter<
  Options extends object = DefaultAdapterOptions,
  Model = unknown,
  Connection = unknown,
  Field = unknown,
  Value = unknown,
  Query extends AdapterQuery<Model, Connection> = AdapterQuery<Model, Connection>,
> extends EventEmitter2 implements AdapterContract<
  Model,
  Connection,
  Field,
  Value,
  Query
>
```

基础类实现全部方法。除 `getDBName()` 返回空字符串外，默认实现都会在下一个 tick 拒绝，并指出方法尚未实现。具体 Adapter 应覆写自己声明支持的操作。

构造函数支持 `new Adapter(options?)` 和 `new Adapter(parent, options)`。后者由 Toshihiko 使用；`parent` 只属于扩展实现，不属于应用 API。

## 原始执行类型

Adapter 可在 `adapterExecuteSpec` symbol 上声明 `AdapterExecuteSpec<Arguments, QueryArguments, Result>`，分别定义 `Toshihiko.execute()`、`Query.execute()` 的参数与共同返回值。

## 类型工具

| 类型 | 从 `Instance` 提取的内容 |
|---|---|
| `AdapterModel<Instance>` | `insert()` 的 Model 参数 |
| `AdapterConnection<Instance>` | `insert()` 的非空 Connection 参数 |
| `AdapterField<Instance>` | `insert()` 数据中的 Field |
| `AdapterValue<Instance>` | `insert()` 数据中的 Value |
| `AdapterQueryType<Instance>` | `find()` 的 Query 参数 |
| `AdapterUpdateByQueryResult<Instance>` | 批量更新的 awaited 结果 |
| `AdapterDeleteByQueryResult<Instance>` | 批量删除的 awaited 结果 |
| `AdapterExecuteArguments<Instance>` | `Toshihiko.execute()` 参数元组 |
| `AdapterQueryExecuteArguments<Instance>` | `Query.execute()` 参数元组 |
| `AdapterExecuteResult<Instance>` | 原始执行的 awaited 结果 |
| `AdapterTransactionConnection<Instance>` | `beginTransaction()` 的 awaited 结果 |
| `AdapterCommitResult<Instance>` | `commit()` 的 awaited 结果 |
| `AdapterRollbackResult<Instance>` | `rollback()` 的 awaited 结果 |

完整示例见[编写扩展](../extensions)。
