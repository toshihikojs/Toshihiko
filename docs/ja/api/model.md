# `Model`

Model は [`Toshihiko#define()`](toshihiko#define) が返すテーブル単位の API です。通常、アプリケーションが Model を直接構築することはありません。

## 型パラメーター

```typescript
class Model<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike = Adapter,
> extends EventEmitter2
```

`Name` はテーブル名リテラル、`Schema` は `define()` に渡したフィールド定義、`AdapterInstance` は接続、Raw 実行、mutation 結果の型を決めます。

## メタデータ

| プロパティ | 型 |
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

まだ保存されていない [Yukari](yukari) を作ります。入力キーは Schema のフィールドに限定されます。入力済みフィールドとデフォルト値を持つフィールドは戻り値で既知となり、それ以外は optional です。

## Query の入口

各メソッドは新しい `Query<Name, Schema, AdapterInstance>` を返します。

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

## 読み取り

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

`find()` は [Query.find()](query#find) と同じ overload を持ちます。`true` を渡すとシリアライズ済み plain object を返します。複合主キーは object で指定します。

## 書き込み、count、Raw 実行

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

各メソッドは新しい Query を作って直ちに実行します。`Model.update()` と `Model.delete()` には条件がありません。全行を対象にしない場合は先に `where()` を使ってください。

## トランザクション

```typescript
beginTransaction(): Promise<AdapterTransactionConnection<AdapterInstance>>
commit(
  connection: AdapterTransactionConnection<AdapterInstance>,
): Promise<AdapterCommitResult<AdapterInstance>>
rollback(
  connection: AdapterTransactionConnection<AdapterInstance>,
): Promise<AdapterRollbackResult<AdapterInstance>>
```

バックエンドが対応する機能を宣言した場合だけ呼び出せます。接続型もバックエンドから推論されます。

## カスタムメソッド

`define(..., { methods })` のメソッドは Model にコピーされ、引数と戻り値の型が保持されます。メソッド内の `this` から Model API と同じ object 内のカスタムメソッドを利用できます。

## 推論結果

```typescript
const User = database.define('users', [
  { name: 'id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
  { name: 'birthday', type: Type.Datetime, allowNull: true },
]);

type UserRow = InferModelRow<typeof User>;
// { id: number; name: string; birthday: Date | null }

type UserPrimaryKey = InferModelPrimaryKey<typeof User>;
// "id"
```

`BuildInput<Schema>` は `Partial<RowFromSchema<Schema>>`、`CompiledSchema<Schema>` は Schema と同じ位置を持つ `Field` tuple です。`BuiltRowFromSchema<Schema, Input>` は入力済みフィールドと default field を必須にし、残りを optional にします。
