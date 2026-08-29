# `Model`

Model 是 [`Toshihiko#define()`](toshihiko#define) 返回的表级 API。业务代码通常不直接构造 Model。

## 类型参数

```typescript
class Model<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike = Adapter,
> extends EventEmitter2
```

`Name` 是表名字面量，`Schema` 是传给 `define()` 的字段定义数组，`AdapterInstance` 决定连接、原始执行和写入结果的类型。

## 元数据

| 属性 | 类型 |
|---|---|
| `name` | `Name` |
| `parent`、`toshihiko` | `Toshihiko<AdapterInstance>` |
| `originalSchema` | `Schema` |
| `schema` | `CompiledSchema<Schema>` |
| `primaryKeys` | `readonly Field<Schema[number]>[]` |
| `autoIncrementField`、`ai` | `Field<Schema[number]> \| null` |
| `nameToColumn` | `NameToColumnMap<Schema>` |
| `columnToName` | `Readonly<Record<string, FieldName<RowFromSchema<Schema>>>>` |
| `fieldNamesMap` | `FieldNamesMap<Schema>` |
| `fieldColumnsMap` | `Readonly<Record<string, Field<Schema[number]>>>` |
| `cache` | `Cache \| null` |
| `options` | `ModelOptions` |

## `build()`

```typescript
build<const Input extends BuildInput<Schema>>(
  fields: Input & Record<
    Exclude<keyof Input, keyof RowFromSchema<Schema>>,
    never
  >,
): BuiltYukari<Name, Schema, Input, AdapterInstance>
```

创建尚未写入数据库的 [Yukari](yukari)。输入只能使用 Schema 字段。调用者提供的字段和带默认值的字段在返回类型中是已知属性，其余字段保持可选。

## 查询入口

每个方法都会创建并返回新的 `Query<Name, Schema, AdapterInstance>`。

```typescript
where(
  condition: QueryWhere<RowFromSchema<Schema>>,
): Query<Name, Schema, AdapterInstance>

fields(
  fields: string | readonly FieldName<RowFromSchema<Schema>>[],
): Query<Name, Schema, AdapterInstance>

field(
  fields: string | readonly FieldName<RowFromSchema<Schema>>[],
): Query<Name, Schema, AdapterInstance>

limit(
  limit: number | string | readonly (number | string)[],
): Query<Name, Schema, AdapterInstance>
limit(
  offset: number | string,
  count: number | string,
): Query<Name, Schema, AdapterInstance>

order(
  order: QueryOrder<RowFromSchema<Schema>>,
): Query<Name, Schema, AdapterInstance>
orderBy(
  order: QueryOrder<RowFromSchema<Schema>>,
): Query<Name, Schema, AdapterInstance>

index(indexName: string): Query<Name, Schema, AdapterInstance>
conn(
  connection: AdapterConnection<AdapterInstance> | null,
): Query<Name, Schema, AdapterInstance>
```

`field()` 与 `orderBy()` 是兼容别名。数组形式的字段名会受 Schema 检查；字符串形式保留给兼容表达式。

## 读取

```typescript
find(): Promise<readonly QueriedYukari<Name, Schema, AdapterInstance>[]>
find(options: QueryFindManyOptions): Promise<readonly QueriedYukari<Name, Schema, AdapterInstance>[]>
find(options: QueryFindOneOptions): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
find(toJSON: true, options?: QueryFindManyOptions): Promise<readonly QueryJsonRow<Schema>[]>
find(toJSON: true, options: QueryFindOneOptions): Promise<QueryJsonRow<Schema> | null>
find(options: QueryFindManyOptions, toJSON: true): Promise<readonly QueryJsonRow<Schema>[]>
find(options: QueryFindOneOptions, toJSON: true): Promise<QueryJsonRow<Schema> | null>

findOne(): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
findOne(toJSON: false): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
findOne(toJSON: true): Promise<QueryJsonRow<Schema> | null>

findById(id: FindByIdInput<Schema>): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
findById(id: FindByIdInput<Schema>, toJSON: false): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
findById(id: FindByIdInput<Schema>, toJSON: true): Promise<QueryJsonRow<Schema> | null>
```

`find()` 与 [Query.find()](query#find) 具有相同重载。传入 `true` 会返回序列化后的普通对象。单主键 Model 可直接传主键值；联合主键应传对象。

```typescript
await User.findById(42);
await Membership.findById({ userId: 42, groupId: 7 });
```

## 写入、计数与原始执行

```typescript
count(): Promise<number>
update(
  data: Partial<RowFromSchema<Schema>>,
): Promise<AdapterUpdateByQueryResult<AdapterInstance>>
delete(): Promise<AdapterDeleteByQueryResult<AdapterInstance>>
execute(
  ...args: AdapterQueryExecuteArguments<AdapterInstance>
): Promise<AdapterExecuteResult<AdapterInstance>>
```

`Model.update()` 与 `Model.delete()` 没有条件。除非确实要操作整张表，否则应先调用 `where()`。

## 事务

```typescript
beginTransaction(): Promise<AdapterTransactionConnection<AdapterInstance>>
commit(
  connection: AdapterTransactionConnection<AdapterInstance>,
): Promise<AdapterCommitResult<AdapterInstance>>
rollback(
  connection: AdapterTransactionConnection<AdapterInstance>,
): Promise<AdapterRollbackResult<AdapterInstance>>
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

## 名称转换与主键

```typescript
convertColumnToName(
  column: string,
): FieldName<RowFromSchema<Schema>> | undefined
convertColumnToName(
  columns: readonly string[],
): readonly (FieldName<RowFromSchema<Schema>> | undefined)[]
convertColumnToName(
  row: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>>

getPrimaryKeysName(): string | readonly string[]
getPrimaryKeysColumn(): string | readonly string[]
```

## 推断结果示例

```typescript
const User = database.define('users', [
  { name: 'id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
  { name: 'birthday', type: Type.Datetime, allowNull: true },
]);

type UserRow = InferModelRow<typeof User>;
// {
//   id: number;
//   name: string;
//   birthday: Date | null;
// }

type UserPrimaryKey = InferModelPrimaryKey<typeof User>;
// "id"

const built = User.build({ name: 'Yukari' });
// built.name: string
// built.id: number | undefined
// built.birthday: Date | null | undefined
```

## 辅助类型

| 类型 | 展开结果 |
|---|---|
| `BuildInput<Schema>` | `Partial<RowFromSchema<Schema>>` |
| `BuiltRowFromSchema<Schema, Input>` | 输入字段和默认字段必填，其余 Schema 字段可选 |
| `CompiledSchema<Schema>` | 与 Schema 元组位置对应的 `Field` 元组 |
| `InferModelRow<typeof Model>` | Model 的完整应用行类型 |
| `InferModelPrimaryKey<typeof Model>` | 标记为主键的字段名联合类型 |
