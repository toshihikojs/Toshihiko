# API リファレンス

このページでは、公開されているランタイム値、メソッドシグネチャ、戻り値の型、拡張契約をまとめます。ガイドは一連の使い方を説明し、このページは個々のメンバーを調べるために使用します。

## パッケージのエントリーポイント

| パッケージ | ランタイムエクスポート | 用途 |
|---|---|---|
| `toshihiko` | `Toshihiko`、`Type`、`Adapter`、`Escaper` | Model、Query、Yukari のコア API |
| `@toshihiko/mysql-adapter` | `MySQLAdapter`、`MySQLSqlBuilder` | MySQL の実行と SQL 生成 |
| `@toshihiko/base-adapter` | `Adapter`、`extend` | Adapter 実装用の基底クラス |
| `@toshihiko/base-cache` | `Cache` | Cache 実装用の基底クラス |
| `@toshihiko/redis-cache` | `RedisCache`、`create` | Redis Cache 実装 |
| `@toshihiko/memcached-cache` | `MemcachedCache`、`create` | Memcached Cache 実装 |
| `@toshihiko/sql-utils` | `escape`、`escapeLike`、`sqlNameToColumn` | SQL 文字列の互換ヘルパー |

すべてのパッケージはランタイムで CommonJS を使用し、TypeScript 宣言を提供します。

## `Toshihiko`

`Toshihiko` は 1 つの Adapter を保持し、その Adapter に結び付いた Model を作成します。

### コンストラクター

```typescript
new Toshihiko(adapter, options?)
```

`adapter` には 3 種類の値を指定できます。

| 形式 | 例 | 動作 |
|---|---|---|
| dialect 名 | `new Toshihiko('mysql', options)` | `@toshihiko/mysql-adapter` をロードする |
| Adapter コンストラクター | `new Toshihiko(MySQLAdapter, options)` | Toshihiko インスタンスとオプションから Adapter を作成する |
| Adapter インスタンス | `new Toshihiko(adapter)` | 渡されたインスタンスをそのまま使用する |

コンストラクターを渡した場合、そのオプション型によって `options` が必須かどうかと、指定できるプロパティが決まります。

### プロパティ

| プロパティ | 型 | 説明 |
|---|---|---|
| `adapter` | 選択した Adapter 型 | 実際に使用する Adapter インスタンス |
| `cache` | `Cache \| null \| undefined` | Adapter オプションで設定したデータベース単位の Cache |
| `database` | `string` | `adapter.getDBName()` の戻り値 |
| `dialect` | `string \| null` | dialect 名または Adapter コンストラクター名 |
| `options` | 選択したオプション型 | コンストラクターオプション |
| `pool` | Adapter に依存 | `MySQLAdapter` などが公開するプール |

### `define()`

```typescript
database.define(name, schema, options?)
```

Model を作成します。戻り値の型には、リテラルのテーブル名、Schema のフィールド名、値の型、null 許可、主キー、カスタムメソッドが保持されます。

```typescript
const User = database.define('users', [
  { name: 'id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
  { name: 'birthday', type: Type.Datetime, allowNull: true },
], {
  cache: false,
  methods: {
    async findByName(name: string) {
      return this.where({ name }).find();
    },
  },
});
```

通常の配列リテラルでもフィールド単位の推論が維持され、`as const` は不要です。メソッド短縮構文で宣言した関数の `this` は、Model と同じ `methods` オブジェクト内の全メソッドを合わせた型として推論されます。関数はランタイムの Model オブジェクトにもコピーされます。

| オプション | 型 | 説明 |
|---|---|---|
| `cache` | `CacheSource \| false \| null` | データベース単位の Cache を上書き、無効化、または解除する |
| `methods` | メソッドオブジェクト | コンテキスト型付き `this` を持つ Model メソッドを追加する |

### その他のメソッド

| シグネチャ | 戻り値 | 説明 |
|---|---|---|
| `getAdapter()` | 具体的な Adapter | 選択した Adapter 型を維持して返す |
| `execute(...args)` | Adapter の実行結果 | raw 実行を Adapter に転送する |
| `Toshihiko.createCache(source)` | `Cache \| null` | Cache インスタンスまたはモジュール形式の設定を正規化する |

## `Model`

Model は `define()` が返す静的なテーブル API で、`EventEmitter2` も継承します。

### メタデータ

| プロパティ | 説明 |
|---|---|
| `name` | リテラルのテーブル名またはコレクション名 |
| `parent`、`toshihiko` | 所有する Toshihiko インスタンス |
| `options` | Model 定義オプション |
| `originalSchema` | 元の Schema 定義 |
| `schema`、`_fields` | コンパイル済みの `Field`。後者は互換エイリアス |
| `primaryKeys` | コンパイル済み主キー Field |
| `autoIncrementField`、`ai` | 自動採番 Field または `null`。後者は互換エイリアス |
| `nameToColumn`、`columnToName` | 論理名と保存列名のマップ |
| `fieldNamesMap`、`fieldColumnsMap` | Field 検索マップ |
| `cache` | 解決済みの Model Cache。未設定時は `null` |

### 行の作成

```typescript
Model.build(fields)
```

新しい `BuiltYukari` を返します。入力キーは Schema に存在するものだけ指定できます。データベース既定値と自動採番値を省略できるため、入力自体は Partial です。呼び出し側が指定したフィールドと既定値を持つフィールドは、戻り値で既知のフィールドになり、ほかは任意のままです。

### Query の開始

次の各メソッドは新しい Query を作成します。

| シグネチャ | 説明 |
|---|---|
| `where(condition)` | 型付き検索条件を設定する |
| `field(fields)`、`fields(fields)` | カンマ区切り文字列またはフィールド名配列を選択する |
| `limit(count)` | 結果数を制限する |
| `limit(offset, count)` | オフセットと結果数を設定する |
| `index(name)` | Adapter 固有のインデックスヒントを設定する |
| `order(order)`、`orderBy(order)` | 並び順を設定する |
| `conn(connection)` | Adapter 接続または `null` を結び付ける |

### 読み書きのショートカット

次のメソッドは Query を作成してすぐに実行します。

| シグネチャ | 戻り値 |
|---|---|
| `find(...)` | overload に応じた Yukari 配列、1 件の Yukari、JSON 行、または `null` |
| `findOne(toJSON?)` | 1 件の Yukari、JSON 行、または `null` |
| `findById(id, toJSON?)` | 主キーに一致する行、または `null` |
| `count()` | `Promise<number>` |
| `update(data)` | Adapter の更新結果 |
| `delete()` | Adapter の削除結果 |
| `execute(...args)` | Adapter の実行結果 |

Model から `update()` または `delete()` を直接呼ぶと、条件のない Query が作成されます。一部の行だけを変更する場合は先に `where()` を呼びます。

### トランザクションと名前変換

| シグネチャ | 説明 |
|---|---|
| `beginTransaction()` | Adapter にトランザクション接続を要求する |
| `commit(connection)` | Adapter トランザクションをコミットする |
| `rollback(connection)` | Adapter トランザクションをロールバックする |
| `convertColumnToName(value)` | 列名文字列、文字列配列、またはオブジェクトを論理フィールド名へ変換する |
| `getPrimaryKeysName()` | 1 つの主キー名、複数の主キー名、または空配列を返す |
| `getPrimaryKeysColumn()` | 1 つの主キー列、複数の主キー列、または空配列を返す |

## `Query`

Query ビルダーメソッドは同じ Query インスタンスを変更して返します。以前の設定を残す必要がある場合は、Model から新しいチェーンを開始してください。

### Query の状態

| プロパティ | 説明 |
|---|---|
| `model` | 元の Model |
| `toshihiko` | 所有する Toshihiko インスタンス |
| `adapter` | Query 作成時に保持した Adapter |
| `cache` | Query 作成時に保持した Model Cache |
| `_conn` | 結び付けた接続または `null` |
| `_fields`、`_where`、`_limit`、`_order`、`_index` | Adapter に渡すコンパイル済み Query 状態 |

アンダースコアで始まるプロパティは Adapter 互換性のために公開されています。アプリケーションコードではビルダーメソッドを使用してください。

### 条件

`where()` は Schema のフィールド名を受け取り、`$and` と `$or` を再帰的に使用できます。

```typescript
User.where({
  $or: [
    { name: { $like: 'A%' } },
    { id: { $between: [10, 20] } },
  ],
});
```

フィールド演算子はフィールド値の型に従います。

| 演算子 | 意味 |
|---|---|
| `$eq`、`===` | 等しい |
| `$neq`、`!==` | 等しくない |
| `$gt`、`>` | より大きい |
| `$gte`、`>=` | 以上 |
| `$lt`、`<` | より小さい |
| `$lte`、`<=` | 以下 |
| `$between` | 両端を含む 2 値の範囲 |
| `$in` | 配列内のいずれかの値に一致 |
| `$like` | Adapter 固有のパターン一致 |
| `$and`、`$or` | 1 フィールドの複数値を組み合わせる |

### 並び順と件数

```typescript
query.orderBy({ createdAt: 'desc' });
query.order('createdAt DESC, id ASC');
query.limit(20);
query.limit(40, 20);
```

方向には `'asc'`、`'ASC'`、`'desc'`、`'DESC'`、または数値を指定できます。文字列と配列形式は互換性のために維持されています。フィールド名の検査にはオブジェクト形式が最適です。

### 読み取り

```typescript
find()
find(options)
find(toJSON, options?)
find(options, toJSON)
```

| オプション | 既定値 | 効果 |
|---|---:|---|
| `single` | `false` | 配列ではなく 1 件または `null` を返す |
| `noCache` | `false` | 設定済み Cache を迂回する |
| `toJSON` 引数 | `false` | Yukari の代わりにシリアライズ済みプレーンオブジェクトを返す |

`findOne(toJSON?)` は 1 件取得のショートカットです。`findById(id, toJSON?)` は主キー条件を作成し、Cache があれば参照します。複合主キーには、主キーフィールドを含むオブジェクトを渡します。

### 実行

| シグネチャ | 戻り値 |
|---|---|
| `count()` | `Promise<number>` |
| `update(data)` | Adapter の更新結果 |
| `delete()` | Adapter の削除結果 |
| `execute(...args)` | 結び付けた接続を使う Adapter の実行結果 |

## `Yukari`

Yukari は行オブジェクトです。Schema から割り当てられたフィールドは、インスタンスの列挙可能なプロパティになります。

### 状態

| プロパティ | 説明 |
|---|---|
| `$model`、`$toshihiko`、`$adapter` | 保持した実行コンテキスト |
| `$schema` | コンパイル済み Model Schema |
| `$source` | `'new'`、`'query'`、`'delete'` のいずれか |
| `$origData` | クエリ時の元の値のスナップショット |
| `$dbName`、`$tableName` | 保存場所 |
| `$cache` | 解決済み Cache |
| `$fromCache` | Cache から復元された行かどうか |

### メソッド

| シグネチャ | 戻り値 | ルール |
|---|---|---|
| `validateOne(name, value)` | `Promise<void>` | 選択した Field の validator を実行する |
| `validateAll()` | `Promise<void>` | 列挙可能なマッピング済み値を検証する |
| `insert(connection?)` | `Promise<this>` | 新しい Yukari だけで使用できる |
| `update(connection?)` | `Promise<this>` | 新しい Yukari では拒否し、元の値で行を特定する |
| `delete(connection?)` | `Promise<true>` | 新しい Yukari では拒否し、状態を削除済みにする |
| `save(connection?)` | `Promise<this>` | 新しい行を insert し、取得済みの行を update する |
| `toJSON(useOriginalData?)` | シリアライズ済み Partial 行 | 各 Field Type の `toJSON()` を適用する |

`insert()` 後も同じオブジェクトは新しく build した行を表します。`update()` または `delete()` の前に、その行を改めて取得してください。

## Schema と `Field`

### Field 定義

| プロパティ | 既定値 | 効果 |
|---|---:|---|
| `name` | 必須 | アプリケーション上のプロパティ名 |
| `column` | `name` | 保存列名 |
| `type` | `Type.String` | parse、restore、等価判定、JSON の動作 |
| `allowNull` | `false` | フィールド値の型に `null` を加える |
| `primaryKey` | `false` | 主キー検索に追加する |
| `autoIncrement` | `false` | ストレージが生成する値を示す |
| `defaultValue` | Field Type の既定値 | `build()` で使用する既定値 |
| `validators` | `[]` | 1 つの validator または validator 配列 |

Validator は成功時に何も返さず、失敗時に空でないエラーメッセージを返します。Promise も返せます。呼び出し時の `this` は Model です。

### コンパイル済み `Field`

| メンバー | 説明 |
|---|---|
| `parse(storageValue)` | 保存データをアプリケーション値へ変換する |
| `restore(value)` | アプリケーション値を保存値へ変換する |
| `equal(left, right)` | 変更追跡のために値を比較する |
| `toJSON(value)` | JSON 出力用に値を変換する |
| `defaultValue`、`needQuotes` | 解決済み Field Type メタデータ |

### 組み込み `Type`

| Type | アプリケーション値 | 保存と JSON の動作 |
|---|---|---|
| `Type.String` | `string` | `String()` で正規化する |
| `Type.Boolean` | `boolean` | `0` または `1` に戻す |
| `Type.Integer` | `number` | `parseInt()` を使用する |
| `Type.Float` | `number` | `parseFloat()` を使用する |
| `Type.Json` | `JsonValue` | JSON を parse、stringify する |
| `Type.Datetime` | `Date` | MySQL 形式の日時文字列に戻し、ISO 形式の文字列にシリアライズする |

独自の `FieldType<Value, StorageValue, JsonValue>` は `parse()` と `restore()` を実装します。必要に応じて `equal()`、`toJSON()`、`defaultValue`、`needQuotes` を追加します。

## Cache 契約

```typescript
interface Cache {
  getData<Value extends object>(
    database: string,
    table: string,
    keys: CacheKey | readonly CacheKey[],
  ): Promise<(Value | null)[]>;

  setData<Value extends object>(
    database: string,
    table: string,
    key: CacheKey,
    data: Value,
  ): Promise<void | boolean | 'OK' | null>;

  deleteData(
    database: string,
    table: string,
    key: CacheKey,
  ): Promise<void | boolean | number>;

  deleteKeys(
    database: string,
    table: string,
    keys: readonly CacheKey[],
  ): Promise<void | readonly number[]>;
}
```

`CacheKey` にはプリミティブキー、複合キー用のオブジェクト、実装がテーブルキーとして解釈する `null` と `undefined` を指定できます。

`@toshihiko/base-cache` はこの契約と一致する抽象 `Cache` クラスをエクスポートします。Redis と Memcached パッケージは具象クラスと `create(servers, options?)` ファクトリーをエクスポートします。[キャッシュ](caching)と[拡張機能の作成](extensions)も参照してください。

## Adapter 契約

`@toshihiko/base-adapter` は `Adapter` 基底クラスをエクスポートします。実装側は次のメソッドを提供します。

| メソッド | 責務 |
|---|---|
| `find(query, options?)` | 保存行を 1 件または複数件読み取る |
| `count(query)` | 一致する行を数える |
| `updateByQuery(query)` | 一致する行を更新する |
| `deleteByQuery(query)` | 一致する行を削除する |
| `insert(model, connection, data)` | 行を挿入し、Yukari が受け取るデータを返す |
| `update(model, connection, primaryKey, data)` | 1 つの Yukari を更新する |
| `execute(...args)` | Adapter 固有の raw コマンドを実行する |
| `getDBName()` | Cache 用のデータベース名前空間を返す |
| `beginTransaction()`、`commit()`、`rollback()` | トランザクションのライフサイクル |

基底メソッドは未実装エラーで非同期に reject します。Adapter のジェネリック引数は、オプション、Model、接続、Field、値、Query の境界を表します。

## MySQL Adapter

```typescript
import {
  MySQLAdapter,
  type MySQLAdapterOptions,
  type MySQLConnection,
  type MySQLMutationResult,
  type MySQLQueryResult,
} from '@toshihiko/mysql-adapter';
```

`MySQLAdapterOptions` は `mysql2` のプールオプションを継承し、次の項目を追加します。

| オプション | 説明 |
|---|---|
| `database` | データベース名 |
| `user`、`username` | MySQL ユーザー。`username` は互換表記 |
| `password` | MySQL パスワード |
| `pool` | 既存の `mysql2/promise` Pool |
| `showSql` | `true` ならコンソール出力、関数なら各 SQL 文字列を渡す |
| `package` | 互換用パッケージ名 |

```typescript
await database.execute(sql, values);
await database.execute(connection, sql, values);
await User.conn(connection).execute(sql, values);
```

最初の 2 形式は `Toshihiko.execute()`、3 つ目は `Query.execute()` を使用します。パッケージは `MySQLSqlBuilder` と、Adapter 向けの Model、Query、Field、statement、接続、プール、結果型もエクスポートします。

## SQL ヘルパー

`Escaper.escape()` と `Escaper.escapeLike()` は、`@toshihiko/sql-utils` の同名関数に対する互換アクセサーです。

| 関数 | 説明 |
|---|---|
| `escape(value)` | 文字列内の引用符、制御文字、バックスラッシュをエスケープする |
| `escapeLike(value)` | `%` と `_` のワイルドカードをエスケープする |
| `sqlNameToColumn(sql, map)` | 引用文字列と SQL キーワードを保持しながら、SQL 断片の論理名を置換する |

ユーザーが制御する値には Adapter のパラメーターバインドを優先してください。エスケープヘルパーは prepared statement の代わりにはなりません。

## 型ユーティリティ

コアパッケージがエクスポートする型は次のグループに分けられます。

| グループ | 主なエクスポート |
|---|---|
| Model 推論 | `InferModelRow`、`InferModelPrimaryKey`、`BuildInput`、`BuiltRowFromSchema` |
| 行オブジェクト | `Yukari`、`BuiltYukari`、`QueriedYukari`、`YukariSource` |
| Schema | `FieldDefinition`、`FieldType`、`SchemaDefinition`、`RowFromSchema`、`JsonRowFromSchema`、`PrimaryKeyNames` |
| Query | `Query`、`QueryWhere`、`QueryFieldOperators`、`QueryOrder`、`QueryFindOptions`、`FindByIdInput` |
| Adapter | `Adapter`、`AdapterConstructor`、`AdapterConnection`、`AdapterData`、`AdapterQuery`、実行・更新結果の補助型 |
| Cache | `Cache`、`CacheKey`、`CacheSource`、`CacheOptions`、Cache 結果型 |

```typescript
type UserRow = InferModelRow<typeof User>;
type UserPrimaryKey = InferModelPrimaryKey<typeof User>;
```

コードが Adapter の接続、オプション、結果の境界を越える場合は、具体的な Adapter パッケージがエクスポートする型を使用してください。
