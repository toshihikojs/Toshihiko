# コアコンセプト

Toshihiko は、データベース操作をライフサイクルの異なる 4 つの公開概念で表します。

| 概念 | 表すもの | 作成方法 |
|---|---|---|
| `Toshihiko` | 設定済みのデータベース入口 | `new Toshihiko(...)` |
| Model | 1 つのテーブルとフィールドの対応 | `database.define(...)` |
| Query | 変更可能な一組の検索条件 | `Model.where(...)` などのクエリビルダー |
| Yukari | 1 レコードのオブジェクトインスタンス | `Model.build(...)` またはクエリ結果 |

## Toshihiko とは

このドキュメントでは、Toshihiko という名前を関連する 2 つの意味で使います。

### Toshihiko と Yukari という名前の由来

プロジェクト名は、東方二次創作『東方戦国夜』の登場人物である[緋村俊彦（八雲俊彦）](https://baike.baidu.com/item/%E7%BB%AF%E6%9D%91%E4%BF%8A%E5%BD%A6/8900097)に由来します。その人物設定では、緋村俊彦は八雲紫（Yakumo Yukari）の意識に憑依され、彼女の分身である八雲俊彦になります。

ORM がレコードオブジェクトを **Yukari instance** と呼ぶのは、この関係が理由です。コード上では JavaScript のオブジェクトインスタンスであり、人物設定では Toshihiko 自身が Yukari の分身、すなわち彼女が別の身体に現れたインスタンスでもあります。`Yukari` は単に「行」を言い換えた名称ではなく、この二重の意味を持つ名前です。

**Toshihiko はプロジェクトとパッケージの名前です。** キャッシュ層を備えた Node.js ORM です。ORM はデータベースレコードと JavaScript オブジェクトを対応付けます。Toshihiko はレコードの CRUD を扱いますが、テーブルの作成や変更、テーブル間のリレーション定義は行いません。

**`Toshihiko` はパッケージが公開するクラスでもあります。** `new Toshihiko(...)` は、設定済みのデータベース入口を作ります。このインスタンスはデータベース名を公開し、Model を作成し、データベースバックエンドの Raw 操作を実行し、Model に Cache を提供できます。

```typescript
const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  username: 'root',
});
```

文字列形式は対応する scoped Adapter パッケージを読み込みます。Adapter のコンストラクターや既存インスタンスも注入できます。

このインスタンス自体はテーブルでも行でもありません。`define()` がテーブル単位の Model を作り、`build()` またはクエリが行単位の Yukari を作ります。

## Model

Model は 1 つのテーブルを Schema に対応付けます。行の構築、クエリ、トランザクション、アプリケーション固有メソッドの起点でもあります。

```typescript
const User = database.define('users', [
  { name: 'id', column: 'user_id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
]);
```

`name` はアプリケーションが使用する論理名、`column` は物理列名です。`column` を省略すると `name` が使われます。

## Query

Model で `where()`、`orderBy()`、`fields()`、`limit()`、`index()`、`conn()` を呼ぶと Query が作られます。設定メソッドは同じ Query を変更して返すため、チェーンできます。

```typescript
const users = await User
  .where({ name: { $like: 'A%' } })
  .orderBy({ id: 'desc' })
  .limit(20)
  .find();
```

独立した状態が必要な場合は Model から新しいチェーンを開始してください。

## Yukari

Yukari は record instance です。この名前は、人物設定で Toshihiko が Yukari の分身であることに由来します。ORM では、特定の Model に属する 1 行を表す具体的なオブジェクトインスタンスです。マッピングされたフィールドは直接読み書きできるプロパティであり、更新と削除に必要な状態はアプリケーション API に公開されません。

```typescript
const row = await User.findById(1);
if (row) {
  row.name = 'Bob';
  await row.update();
}
```

`build()` は挿入用の `new` 状態を作ります。クエリは `query` 状態を作り、元データは変更検出と更新・削除時の行特定に使われます。挿入後も `build()` した Yukari は `new` のままです。更新や削除の前に検索し直してください。

Model と Yukari は、それぞれテーブル単位と行単位のオブジェクトです。`User.findById()` は Model の操作、`user.save()` は Yukari の操作です。状態の詳細は [Yukari 行](yukari.md) を参照してください。

## Adapter と Cache

Adapter は接続プール、SQL、バインド値、トランザクション、ドライバー戻り値を担当します。通常のアプリケーションは `Toshihiko` の作成時に Adapter を選ぶだけです。Adapter 契約はデータベース拡張の開発者向けです。Cache は取得、保存、単一キー削除、複数キー削除の 4 つの Promise 操作を提供します。Model はデータベースの Cache を継承、置換、無効化できます。

## 型の流れ

Model Schema は `build()` 入力、`where()` 条件、`findById()` の主キー、Yukari プロパティ、JSON 出力を一貫して決定します。カスタム Field Type の保存値、アプリケーション値、JSON 値も同じ経路を流れます。
