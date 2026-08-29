# `Toshihiko`

`Toshihiko` はデータベースバックエンドを設定し、そのバックエンドに結び付いた Model を作ります。

```typescript
import { Toshihiko } from 'toshihiko';
```

## コンストラクター

```typescript
class Toshihiko<
  AdapterInstance extends AdapterLike = Adapter,
  Options extends object = ToshihikoOptions,
> extends EventEmitter2 {
  constructor(
    adapter: AdapterSource<Options, AdapterInstance>,
    ...options: {} extends Options
      ? readonly [options?: Options]
      : readonly [options: Options]
  );
}
```

| 引数 | 型 | 説明 |
|---|---|---|
| `adapter` | `AdapterSource<Options, AdapterInstance>` | 方言名、Adapter コンストラクター、またはインスタンス |
| `options` | `Options` | データベース設定。必須プロパティがあれば省略不可 |

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
| `options` | `Options` | コンストラクター設定 |
| `pool` | `AdapterInstance extends { readonly mysql: infer Pool } ? Pool : undefined` | MySQL 互換入口 |

Adapter インスタンスはアプリケーション API に公開されません。

## `define()`

```typescript
define<
  const Name extends string,
  const Schema extends SchemaDefinition,
  const Methods extends object = object,
>(
  collectionName: Name,
  schema: Schema,
  options?: ModelDefinitionOptions<
    Name,
    Schema,
    AdapterInstance,
    Methods
  >,
): Model<Name, Schema, AdapterInstance> & Methods
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
execute(
  ...args: AdapterExecuteArguments<AdapterInstance>
): Promise<AdapterExecuteResult<AdapterInstance>>
```

選択したバックエンドの Raw 操作を実行します。引数と戻り値はバックエンドから推論されます。MySQL は [Raw SQL](../raw-sql) を参照してください。

## `Toshihiko.createCache()`

```typescript
static createCache(source: unknown): Cache | null
```

既存 Cache はそのまま返し、モジュール形式の設定からは Cache を作り、無効な入力には `null` を返します。詳細は [Cache API](cache) を参照してください。

## 関連する型

```typescript
interface AdapterConstructor<Options extends object, Instance extends AdapterLike> {
  new (parent: Toshihiko<Instance, Options>, options: Options): Instance;
}

type AdapterSource<Options extends object, Instance extends AdapterLike> =
  | string
  | Instance
  | AdapterConstructor<Options, Instance>;
```

`AdapterExecuteArguments` と `AdapterExecuteResult` は具体的な Adapter から Raw 実行の引数と結果を抽出します。`ModelDefinitionOptions` は `cache` と contextual `this` を持つ `methods` を表します。
