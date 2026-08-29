# Adapter API

このページはデータベース Adapter の開発者向けです。既存 Adapter を使うアプリケーションは `new Toshihiko(...)` でバックエンドを選択するだけで、Adapter インスタンスや Query の内部状態に依存しません。

## コア契約

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

optional method は具体的な Adapter が宣言した場合だけ Model または Query から呼び出せます。

`object` には配列、クラスインスタンス、関数が含まれます。そのため `DataValue` は runtime Adapter が保存、設定、返却できる JavaScript 値を網羅します。`AdapterOperationResult` は具体的なドライバー型が未指定の場合だけ使う基礎契約です。実装 Adapter は更新、削除、raw 実行の結果をドライバー固有型へ絞り込みます。

## Query snapshot

コアが Adapter に渡すものは公開 `Query` インスタンスではなく、読み取り専用 snapshot です。

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

完全な宣言は `UpdateData` と `Where` も型パラメーターとして受け取ります。コアは `Partial<RowFromSchema<Schema>>` と `QueryWhere<RowFromSchema<Schema>>` を渡すため、具体的な Adapter は更新フィールド、条件フィールド、各フィールド値の型を取得できます。これらの名前は拡張契約であり、アプリケーションの Query に読み書き可能なプロパティとして公開されません。

## 行と書き込みデータ

```typescript
type AdapterRow = DataRow;
interface AdapterData<Field, Value> {
  readonly field: Field;
  readonly value: Value;
}
type AdapterFindResult = AdapterRow | readonly AdapterRow[] | null;
```

Adapter の Raw 行は保存列名を使用します。コアが Field で値を parse し、Yukari を生成します。

## 基底クラス

```typescript
import { Adapter } from '@toshihiko/base-adapter';

class ExampleAdapter extends Adapter<
  Options, Model, Connection, Field, Value, Query
> {}
```

基底クラス自体の型パラメーターは次のとおりです。

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

基底クラスは全操作を持ちます。`getDBName()` は空文字列を返し、それ以外の初期実装は次の tick で未実装エラーとして reject します。具体的な Adapter は対応する操作を override してください。

コンストラクターは `new Adapter(options?)` と `new Adapter(parent, options)` を受け付けます。`parent` は拡張実装だけの情報で、アプリケーション API には含まれません。

## Raw 実行と型ユーティリティ

`adapterExecuteSpec` symbol 上に `AdapterExecuteSpec<Arguments, QueryArguments, Result>` を宣言すると、Toshihiko と Query の execute 引数、および戻り値を定義できます。

| 型 | `Instance` から抽出する内容 |
|---|---|
| `AdapterModel<Instance>` | `insert()` の Model 引数 |
| `AdapterConnection<Instance>` | `insert()` の non-null Connection 引数 |
| `AdapterField<Instance>` | `insert()` data の Field |
| `AdapterValue<Instance>` | `insert()` data の Value |
| `AdapterQueryType<Instance>` | `find()` の Query 引数 |
| `AdapterUpdateByQueryResult<Instance>` | bulk update の awaited 結果 |
| `AdapterDeleteByQueryResult<Instance>` | bulk delete の awaited 結果 |
| `AdapterExecuteArguments<Instance>` | `Toshihiko.execute()` 引数 tuple |
| `AdapterQueryExecuteArguments<Instance>` | `Query.execute()` 引数 tuple |
| `AdapterExecuteResult<Instance>` | Raw 実行の awaited 結果 |
| `AdapterTransactionConnection<Instance>` | transaction connection |
| `AdapterCommitResult<Instance>` | commit の awaited 結果 |
| `AdapterRollbackResult<Instance>` | rollback の awaited 結果 |

完全な例は[拡張機能の作成](../extensions)を参照してください。
