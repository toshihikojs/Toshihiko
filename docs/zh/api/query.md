# `Query`

Query 描述一次数据库操作。构建方法会修改当前 Query，并返回同一个实例。需要两组独立状态时，应分别从 Model 开始调用链。

```typescript
class Query<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike = Adapter,
>
```

## `where()`

```typescript
where(condition: QueryWhere<RowFromSchema<Schema>>): this
```

替换当前条件，不会与上一次调用合并。

```typescript
User.where({
  $or: [
    { name: { $like: 'A%' } },
    { id: { $between: [10, 20] } },
  ],
});
```

条件的完整类型为：

```typescript
interface QueryFieldOperators<Value> {
  readonly $and?: Value | readonly Value[];
  readonly $between?: readonly [Value, Value];
  readonly $eq?: Value;
  readonly $gt?: Value;
  readonly $gte?: Value;
  readonly $in?: readonly Value[];
  readonly $like?: Value;
  readonly $lt?: Value;
  readonly $lte?: Value;
  readonly $neq?: Value;
  readonly $or?: Value | readonly Value[];
  readonly '<'?: Value;
  readonly '<='?: Value;
  readonly '==='?: Value;
  readonly '>'?: Value;
  readonly '>='?: Value;
  readonly '!=='?: Value;
}

type QueryFieldCondition<Value> = Value | QueryFieldOperators<Value>;

type QueryWhere<Row extends object> = {
  readonly [Name in keyof Row]?: QueryFieldCondition<Row[Name]>;
} & {
  readonly $and?: QueryWhere<Row> | readonly QueryWhere<Row>[];
  readonly $or?: QueryWhere<Row> | readonly QueryWhere<Row>[];
};
```

因此，`id: { $gte: '10' }` 会在 `id` 为 `number` 时直接产生类型错误。非对象条件会同步抛错。

## 字段、排序、限制与连接

```typescript
fields(fields: string | readonly FieldName<RowFromSchema<Schema>>[]): this
field(fields: string | readonly FieldName<RowFromSchema<Schema>>[]): this

order(order: QueryOrder<RowFromSchema<Schema>>): this
orderBy(order: QueryOrder<RowFromSchema<Schema>>): this

limit(limit: number | string | readonly (number | string)[]): this
limit(offset: number | string, count: number | string): this

index(indexName: string): this
conn(connection: AdapterConnection<AdapterInstance> | null): this
```

`field()` 与 `orderBy()` 是兼容别名。数组形式的字段和对象形式的排序能够获得字段名检查。`conn()` 绑定由 `beginTransaction()` 返回的连接。

## `find()`

```typescript
find(): Promise<readonly QueriedYukari<Name, Schema, AdapterInstance>[]>
find(options: QueryFindManyOptions): Promise<readonly QueriedYukari<Name, Schema, AdapterInstance>[]>
find(options: QueryFindOneOptions): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
find(toJSON: false, options?: QueryFindManyOptions): Promise<readonly QueriedYukari<Name, Schema, AdapterInstance>[]>
find(toJSON: false, options: QueryFindOneOptions): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
find(toJSON: true, options?: QueryFindManyOptions): Promise<readonly QueryJsonRow<Schema>[]>
find(toJSON: true, options: QueryFindOneOptions): Promise<QueryJsonRow<Schema> | null>
find(options: QueryFindManyOptions, toJSON: true): Promise<readonly QueryJsonRow<Schema>[]>
find(options: QueryFindOneOptions, toJSON: false): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
find(options: QueryFindOneOptions, toJSON: true): Promise<QueryJsonRow<Schema> | null>
```

```typescript
interface QueryFindOptions {
  readonly noCache?: boolean;
  readonly single?: boolean;
}

interface QueryFindManyOptions extends QueryFindOptions {
  readonly single?: false;
}

interface QueryFindOneOptions extends QueryFindOptions {
  readonly single: true;
}

type QueryJsonRow<Schema extends SchemaDefinition> =
  Partial<JsonRowFromSchema<Schema>>;
```

| 选项 | 默认值 | 作用 |
|---|---:|---|
| `toJSON` | `false` | 返回普通序列化对象 |
| `single` | `false` | 只取一条，不存在时返回 `null` |
| `noCache` | `false` | 本次读取跳过缓存 |

布尔值与选项对象支持兼容的参数顺序；字面量 `true` 会参与返回类型推断。

## `findOne()` 与 `findById()`

```typescript
findOne(): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
findOne(toJSON: false): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
findOne(toJSON: true): Promise<QueryJsonRow<Schema> | null>

findById(id: FindByIdInput<Schema>): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
findById(id: FindByIdInput<Schema>, toJSON: false): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
findById(id: FindByIdInput<Schema>, toJSON: true): Promise<QueryJsonRow<Schema> | null>
```

联合主键使用对象。无主键或联合主键 Model 收到原始值时会抛错。缓存读取失败会回退到数据库。

## 计数与写入

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

`update()` 与 `delete()` 使用当前条件、排序和限制。`execute()` 使用 `conn()` 绑定的连接。具体结果类型由数据库后端推断。

## 相关类型

```typescript
type QueryOrderDirection = number | 'asc' | 'ASC' | 'desc' | 'DESC';

type QueryOrder<Row extends object> =
  | string
  | Readonly<Partial<Record<FieldName<Row>, QueryOrderDirection>>>
  | readonly (
      | string
      | Readonly<Partial<Record<FieldName<Row>, QueryOrderDirection>>>
    )[];

type FindByIdInput<Schema extends SchemaDefinition> =
  RowFromSchema<Schema>[PrimaryKeyNames<Schema>]
  | DataRow;
```

单主键可以直接传该字段的值；联合主键使用对象。没有主键或联合主键 Model 收到原始值时会抛错。
