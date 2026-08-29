# Adapter API

本页面向数据库 Adapter 开发者。使用现成 Adapter 的业务代码只需通过 `new Toshihiko(...)` 选择后端，不应依赖 Adapter 实例或查询内部状态。

## 核心契约

```typescript
type DataValue =
  | object
  | string
  | number
  | bigint
  | boolean
  | symbol
  | null
  | undefined;

type DataRow = Readonly<Record<string, DataValue>>;
type AdapterOperationResult = DataValue | void;

interface Adapter<
  Model = object,
  Connection = object,
  Field = object,
  Value = DataValue,
  Query extends AdapterQuery<Model, Connection> = AdapterQuery<Model, Connection>,
  ExecuteSpec extends AdapterExecuteSpec<
    readonly DataValue[],
    readonly DataValue[],
    AdapterOperationResult
  > = DefaultAdapterExecuteSpec,
> {
  find(query: Query, options?: AdapterFindOptions): Promise<AdapterFindResult>;
  count(query: Query): Promise<number>;
  insert(model: Model, connection: Connection | null,
    data: readonly AdapterData<Field, Value>[]): Promise<AdapterRow | null>;
  update(model: Model, connection: Connection | null,
    primaryKey: DataRow,
    data: readonly AdapterData<Field, Value>[]): Promise<AdapterOperationResult>;
  deleteByQuery(query: Query): Promise<AdapterOperationResult>;
  getDBName(): string;

  updateByQuery?(query: Query): Promise<AdapterOperationResult>;
  execute?(...args: ExecuteSpec['arguments']): Promise<ExecuteSpec['result']>;
  beginTransaction?(): Promise<Connection>;
  commit?(connection: Connection): Promise<AdapterOperationResult>;
  rollback?(connection: Connection): Promise<AdapterOperationResult>;
}
```

只有具体 Adapter 声明了可选方法时，对应的 Model 或 Query 方法才可在 TypeScript 中调用。

## Query 快照

核心交给 Adapter 的不是公开 `Query` 实例，而是只读快照：

```typescript
interface AdapterQuery<
  Model,
  Connection,
  Cache,
  UpdateData extends object = DataRow,
  Where extends object = DataRow,
> {
  readonly cache: Cache;
  readonly connection: Connection | null;
  readonly fields: readonly string[];
  readonly index: string;
  readonly limit: readonly number[];
  readonly model: Model;
  readonly order: readonly Readonly<Record<string, number>>[];
  readonly updateData: UpdateData;
  readonly where: Where;
}
```

完整声明还接受 `UpdateData` 与 `Where` 两个泛型，默认都是 `DataRow`。核心实际传入的类型分别是 `Partial<RowFromSchema<Schema>>` 与 `QueryWhere<RowFromSchema<Schema>>`，所以具体 Adapter 能知道更新字段、查询字段和各字段值的类型。以上名称是扩展契约，不会作为应用 Query 的可读写属性暴露。

## 行与写入数据

```typescript
type AdapterRow = DataRow;
interface AdapterData<Field, Value> {
  readonly field: Field;
  readonly value: Value;
}
type AdapterFindResult = AdapterRow | readonly AdapterRow[] | null;
```

Adapter 返回的原始行应使用存储列名；核心会调用 Field 解析并生成 Yukari。

`object` 包括数组、类实例和函数。`DataValue` 因此覆盖运行时能够存储、配置或返回的 JavaScript 值。`AdapterOperationResult` 只用于未指定具体驱动时的基础契约；具体 Adapter 应把更新、删除和原始执行结果收窄为驱动类型，例如 MySQL 的 `ResultSetHeader` 与 `QueryResult`。

## 基础类

```typescript
import { Adapter } from '@toshihiko/base-adapter';

class ExampleAdapter extends Adapter<
  Options,
  Model,
  Connection,
  Field,
  Value,
  Query,
  ExecuteSpec
> {}
```

基础类本身的声明为：

```typescript
class Adapter<
  Options extends object = DefaultAdapterOptions,
  Model = object,
  Connection = object,
  Field = object,
  Value = DataValue,
  Query extends AdapterQuery<Model, Connection> = AdapterQuery<Model, Connection>,
  ExecuteSpec extends AdapterExecuteSpec<
    readonly DataValue[],
    readonly DataValue[],
    AdapterOperationResult
  > = DefaultAdapterExecuteSpec,
> extends EventEmitter2 implements AdapterContract<
  Model,
  Connection,
  Field,
  Value,
  Query,
  ExecuteSpec
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
