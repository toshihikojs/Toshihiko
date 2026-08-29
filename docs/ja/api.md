# API リファレンス

このページは v2 公開 API の索引です。正確なジェネリックと Adapter 固有の overload はビルド済み TypeScript 宣言を参照してください。

## 実行時エクスポート

| エクスポート | 説明 |
|---|---|
| `Toshihiko` | データベース入口と Model ファクトリー。 |
| `Type` | 組み込み Field Type。 |
| `Adapter` | Base と MySQL Adapter コンストラクターの互換入口。 |
| `Escaper` | `escape()` と `escapeLike()`。 |

## Toshihiko

主なメンバーは `adapter`、`cache`、`database`、`dialect`、`options`、`pool`、`define()`、`execute()`、`getAdapter()`、静的 `createCache()` です。コンストラクターは dialect 名、Adapter コンストラクター、Adapter インスタンスを受け取れます。

## Model

メタデータには `name`、`parent`、`originalSchema`、`schema`、`primaryKeys`、`autoIncrementField`、名前・フィールドマップ、`cache` があります。

操作には `build()`、`where()`、`fields()`、`limit()`、`index()`、`orderBy()`、`conn()`、`find()`、`findOne()`、`findById()`、`count()`、`update()`、`delete()`、`execute()`、トランザクションメソッドがあります。`methods` の内容は戻り Model の型と実行時オブジェクトに追加されます。

## Query

`where()`、`fields()`、`limit()`、`order()`、`index()`、`conn()` は同じ Query を変更して返します。実行メソッドは `find()`、`findOne()`、`findById()`、`count()`、`update()`、`delete()`、`execute()` です。

## Yukari

状態には `$model`、`$schema`、`$source`、`$origData`、`$fromCache` があります。操作は `validateOne()`、`validateAll()`、`insert()`、`update()`、`delete()`、`save()`、`toJSON()` です。Schema フィールドは Yukari プロパティになります。

## 公開型

よく使う型は `Model`、`Query`、`Yukari`、`BuiltYukari`、`QueriedYukari`、`FieldType`、`SchemaDefinition`、`RowFromSchema`、`QueryWhere`、`QueryOrder`、`Adapter`、`AdapterConnection`、`Cache`、`CacheKey`、`InferModelRow`、`InferModelPrimaryKey` です。
