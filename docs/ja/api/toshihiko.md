# `Toshihiko`

`Toshihiko` は設定済みデータベースの入口です。通常、アプリケーションは 1 つのインスタンスを作り、そこから Model を定義します。

## インスタンスの作成

TypeScript では Adapter class を直接渡す方法を推奨します。コンストラクターが Adapter 固有の設定型を検査できます。

```typescript
import { Toshihiko } from 'toshihiko';
import { MySQLAdapter } from '@toshihiko/mysql-adapter';

const database = new Toshihiko(MySQLAdapter, {
  database: 'app',
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  password: 'secret',
});
```

短い dialect 名も利用できます。`'mysql'` は `@toshihiko/mysql-adapter` を読み込みます。

```typescript
const database = new Toshihiko('mysql', {
  database: 'app',
  host: '127.0.0.1',
  username: 'root',
});
```

### MySQL 設定

公式 MySQL Adapter の `options` は `MySQLAdapterOptions` です。よく使うフィールドは次のとおりです。

| フィールド | 型 | 初期値 | 説明 |
|---|---|---:|---|
| `database` | `string` | `'toshihiko'` | データベース名と Cache の database namespace |
| `host` | `string` | `'localhost'` | MySQL のホスト名または IP address |
| `port` | `number` | `3306` | MySQL port |
| `user` | `string` | `''` | MySQL user name |
| `username` | `string` | — | `user` の互換表記。両方指定した場合はこちらを使用 |
| `password` | `string` | `''` | MySQL password |
| `pool` | `MySQLPool` | — | 既存の `mysql2/promise` Pool を再利用。省略時は新規作成 |
| `showSql` | `false \| true \| ((sql: string) => void)` | `false` | `true` は `console.log`、関数には format 済み SQL を渡す |
| `cache` | `Cache \| CacheOptions` | — | 既存 Cache、または `module`、`path`、`name` と constructor 引数を含む[モジュール設定](cache#設定)。Model が継承する |
| その他 | [`mysql2.PoolOptions`](https://sidorares.github.io/node-mysql2/docs/examples/connections/create-pool) | `mysql2` に従う | `connectionLimit`、`charset`、`ssl`、timeout など |

全 MySQL 設定は [MySQL Adapter API](mysql#アプリケーション設定)を参照してください。他の Adapter は独自の `options` object を定義します。

### コンストラクター引数

| 引数 | 受け付ける値 | 説明 |
|---|---|---|
| `adapter` | Dialect 名、Adapter class、Adapter instance | データベース実装を選択。class を渡すと設定型も取得できる |
| `options` | 選択した Adapter の設定 object | Adapter に渡され、`database.options` に保持される |

構築済み Adapter instance を渡す場合、`options` は渡しません。

```typescript
const adapter = new MySQLAdapter({ database: 'app' });
const database = new Toshihiko(adapter);
```

## プロパティ

| プロパティ | アプリケーションから見える型 | 内容 |
|---|---|---|
| `database` | `string` | Adapter が返す現在のデータベース名 |
| `dialect` | `string \| null` | Dialect 名。instance 注入時は通常 Adapter class 名 |
| `options` | 選択した Adapter の設定 object | コンストラクターに渡した元の設定 |
| `cache` | `Cache \| null \| undefined` | 現在の database-level Cache |
| `pool` | MySQL では `MySQLPool`、その他では `undefined` | MySQL Pool の互換入口 |

## `define()`

```typescript
database.define(name, schema, options?)
```

| 引数 | 型 | 説明 |
|---|---|---|
| `name` | `string` | テーブル名。文字列リテラルは Model 型に保持される |
| `schema` | `readonly FieldDefinition[]` | フィールド名、Field Type、列、主キー、default、Validator |
| `options.cache` | `CacheSource \| false \| null` | 継承した Cache を置換または無効化 |
| `options.methods` | メソッド object | Model にコピーされ、引数と戻り値の型を保持 |

```typescript
const User = database.define('users', [
  { name: 'id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
], {
  cache: false,
  methods: {
    async findByName(name: string) {
      return this.where({ name }).find();
    },
  },
});

const users = await User.findByName('Yukari');
```

返される Model は `schema` からフィールド名、値、null 許可、主キー、JSON 値を推論します。`methods` では method shorthand または通常の `function` を使うと、`this` が完全な Model として推論されます。

## `execute()`

Raw 実行の引数と結果は Adapter が決めます。公式 MySQL Adapter は次の形式です。

```typescript
database.execute(
  sql: string,
  values?: MySQLValues,
): Promise<MySQLQueryResult>

database.execute(
  connection: MySQLConnection | null,
  sql: string,
  values?: MySQLValues,
): Promise<MySQLQueryResult>
```

`MySQLValues` は readonly array または parameter 名を key にした readonly object です。[Raw SQL](../raw-sql)も参照してください。

## `Toshihiko.createCache()`

```typescript
Toshihiko.createCache(source: unknown): Cache | null
```

既存 Cache はそのまま返します。module 形式の設定は Cache を作成し、認識できない値は `null` を返します。通常のアプリケーションは Cache を直接構築し、module 形式は互換用途で使います。詳細は [Cache API](cache) を参照してください。

## Adapter 開発者向け generics

アプリケーションコードが次の generics を記述する必要はありません。カスタム Adapter の options、connection、実行結果を Model と Query に伝えるための型です。

```typescript
class Toshihiko<
  AdapterInstance extends AdapterLike = Adapter,
  Options extends object = ToshihikoOptions,
> extends EventEmitter2

type AdapterSource<Options extends object, Instance extends AdapterLike> =
  | string
  | Instance
  | AdapterConstructor<Options, Instance>;
```
