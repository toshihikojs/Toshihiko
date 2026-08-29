# `Query`

Query は 1 回のデータベース操作を表します。Builder メソッドは現在の Query を変更し、同じインスタンスを返します。独立した状態が必要なら Model から別の chain を開始してください。

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

現在の条件を置き換えます。前回の条件とは merge しません。

```typescript
User.where({
  $or: [
    { name: { $like: 'A%' } },
    { id: { $between: [10, 20] } },
  ],
});
```

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

フィールドごとに `Value` が決まるため、number field に string の比較値を渡すと型エラーになります。

## フィールド、順序、制限、接続

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

`field()` と `orderBy()` は互換エイリアスです。フィールド配列と順序 object には Schema のフィールド名チェックが働きます。`conn()` には `beginTransaction()` が返した接続を渡します。

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

| オプション | 初期値 | 動作 |
|---|---:|---|
| `toJSON` | `false` | シリアライズ済み object を返す |
| `single` | `false` | 1 行だけ返し、存在しなければ `null` |
| `noCache` | `false` | この読み取りでは Cache を使わない |

boolean と options object は互換の引数順序を利用できます。リテラル `true` が戻り値の型を決定します。

## `findOne()` と `findById()`

```typescript
findOne(): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
findOne(toJSON: false): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
findOne(toJSON: true): Promise<QueryJsonRow<Schema> | null>
findById(id: FindByIdInput<Schema>): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
findById(id: FindByIdInput<Schema>, toJSON: false): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>
findById(id: FindByIdInput<Schema>, toJSON: true): Promise<QueryJsonRow<Schema> | null>
```

複合主キーは object を使います。Cache 読み取りエラーはデータベースへの fallback になります。

## count と書き込み

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

`update()` と `delete()` は現在の条件、順序、制限を利用します。`execute()` は `conn()` で設定した接続を利用します。具体的な戻り値はバックエンドから推論されます。

```typescript
type QueryOrderDirection = number | 'asc' | 'ASC' | 'desc' | 'DESC';
type QueryOrder<Row extends object> =
  | string
  | Readonly<Partial<Record<FieldName<Row>, QueryOrderDirection>>>
  | readonly (
      | string
      | Readonly<Partial<Record<FieldName<Row>, QueryOrderDirection>>>
    )[];
```

`FindByIdInput<Schema>` は単一主キーの値または主キー object です。複合主キーは object で指定します。
