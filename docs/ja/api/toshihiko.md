# `Toshihiko`

`Toshihiko` はデータベースバックエンドを設定し、そのバックエンドに結び付いた Model を作ります。

```typescript
import { Toshihiko } from 'toshihiko';
```

## コンストラクター

```typescript
new Toshihiko(adapter, options?)
```

| 引数 | 型 | 説明 |
|---|---|---|
| `adapter` | 方言名、Adapter コンストラクター、またはインスタンス | データベース実装を選択 |
| `options` | 選択した実装から推論 | データベース設定。`database.options` に保持 |

```typescript
const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  username: 'root',
});
```

`'mysql'` は `@toshihiko/mysql-adapter` を読み込みます。`.`、`/`、`@` で始まる名前はそのまま解決されます。コンストラクターや既存インスタンスの注入は、依存性注入と拡張テストに利用できます。

## プロパティ

| プロパティ | 型 | 説明 |
|---|---|---|
| `cache` | `Cache \| null \| undefined` | データベース単位の Cache |
| `database` | `string` | 現在のデータベース名前空間 |
| `dialect` | `string \| null` | 方言名またはコンストラクター名 |
| `options` | 選択した設定型 | コンストラクター設定 |
| `pool` | バックエンド固有 Pool または `undefined` | MySQL 互換入口 |

Adapter インスタンスはアプリケーション API に公開されません。

## `define()`

```typescript
database.define(name, schema, options?)
```

[Model](model) を作り、テーブル名、フィールド名、値、null 許可、主キー、カスタムメソッドの型を保持します。

```typescript
const User = database.define('users', [
  { name: 'id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
], {
  methods: {
    async findByName(name: string) {
      return this.where({ name }).find();
    },
  },
});
```

`methods` にはメソッド短縮記法を使います。これにより `this` は Model と同じオブジェクト内の全カスタムメソッドを含む型になります。アロー関数にはこの `this` がありません。

## `execute()`

```typescript
database.execute(...args): Promise<Result>
```

選択したバックエンドの Raw 操作を実行します。引数と戻り値はバックエンドから推論されます。MySQL は [Raw SQL](../raw-sql) を参照してください。

## `Toshihiko.createCache()`

既存 Cache はそのまま返し、モジュール形式の設定からは Cache を作り、無効な入力には `null` を返します。詳細は [Cache API](cache) を参照してください。
