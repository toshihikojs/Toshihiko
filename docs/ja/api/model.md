# `Model`

Model は [`Toshihiko#define()`](toshihiko#define) が返すテーブル単位の API です。通常、アプリケーションが Model を直接構築することはありません。

## メタデータ

| プロパティ | 説明 |
|---|---|
| `name` | `define()` に渡したテーブル名リテラル |
| `schema` | コンパイル済み `Field[]` |
| `primaryKeys` | 主キーとして指定した Field |
| `autoIncrementField` | 自動採番 Field。なければ `null` |
| `nameToColumn`、`columnToName` | 論理名と保存列名の対応 |
| `fieldNamesMap`、`fieldColumnsMap` | 名前から Field への対応 |
| `cache` | Model が使用する Cache |
| `options` | `define()` の Model 設定 |

## `build()`

```typescript
Model.build(fields): BuiltYukari
```

まだ保存されていない [Yukari](yukari) を作ります。入力キーは Schema のフィールドに限定されます。入力済みフィールドとデフォルト値を持つフィールドは戻り値で既知となり、それ以外は optional です。

## Query の入口

各メソッドは新しい [Query](query) を作ります。

| メソッド | 動作 |
|---|---|
| `where(condition)` | 型付き条件を設定 |
| `fields(fields)` | フィールドを選択 |
| `field(fields)` | `fields()` の互換エイリアス |
| `limit(count)`、`limit(offset, count)` | 件数と offset |
| `order(order)`、`orderBy(order)` | 順序 |
| `index(name)` | バックエンド固有 index hint |
| `conn(connection)` | トランザクション接続を設定 |

## 読み取り

```typescript
Model.find(options?): Promise<readonly QueriedYukari[]>
Model.findOne(toJSON?): Promise<QueriedYukari | null>
Model.findById(id, toJSON?): Promise<QueriedYukari | null>
```

`find()` は [Query.find()](query#find) と同じ overload を持ちます。`true` を渡すとシリアライズ済み plain object を返します。複合主キーは object で指定します。

## 書き込み、count、Raw 実行

`count()`、`update(data)`、`delete()`、`execute(...args)` は新しい Query を作って直ちに実行します。`Model.update()` と `Model.delete()` には条件がありません。全行を対象にしない場合は先に `where()` を使ってください。

## トランザクション

```typescript
Model.beginTransaction(): Promise<Connection>
Model.commit(connection): Promise<Result>
Model.rollback(connection): Promise<Result>
```

バックエンドが対応する機能を宣言した場合だけ呼び出せます。接続型もバックエンドから推論されます。

## カスタムメソッド

`define(..., { methods })` のメソッドは Model にコピーされ、引数と戻り値の型が保持されます。メソッド内の `this` から Model API と同じ object 内のカスタムメソッドを利用できます。

関連する型は `Model`、`ModelOptions`、`ModelDefinitionOptions`、`BuildInput`、`InferModelRow`、`InferModelPrimaryKey` です。
