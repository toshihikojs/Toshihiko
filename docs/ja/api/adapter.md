# Adapter API

このページはデータベース Adapter の開発者向けです。既存 Adapter を使うアプリケーションは `new Toshihiko(...)` でバックエンドを選択するだけで、Adapter インスタンスや Query の内部状態に依存しません。

## コア契約

```typescript
interface Adapter<Model, Connection, Field, Value, Query> {
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

optional method は具体的な Adapter が宣言した場合だけ Model または Query から呼び出せます。

## Query snapshot

コアが Adapter に渡すものは公開 `Query` インスタンスではなく、読み取り専用 snapshot です。

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

これらの名前は拡張契約であり、アプリケーションの Query に読み書き可能なプロパティとして公開されません。

## 行と書き込みデータ

```typescript
type AdapterRow = Readonly<Record<string, unknown>>;
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

基底クラスは全操作を持ちます。`getDBName()` は空文字列を返し、それ以外の初期実装は次の tick で未実装エラーとして reject します。具体的な Adapter は対応する操作を override してください。

コンストラクターは `new Adapter(options?)` と `new Adapter(parent, options)` を受け付けます。`parent` は拡張実装だけの情報で、アプリケーション API には含まれません。

## Raw 実行と型ユーティリティ

`adapterExecuteSpec` symbol 上に `AdapterExecuteSpec<Arguments, QueryArguments, Result>` を宣言すると、Toshihiko と Query の execute 引数、および戻り値を定義できます。

`AdapterModel`、`AdapterConnection`、`AdapterField`、`AdapterValue`、`AdapterQueryType`、execute と transaction の補助型は、具体的な Adapter から境界型を抽出します。

完全な例は[拡張機能の作成](../extensions)を参照してください。
