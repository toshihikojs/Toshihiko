# v1 からの移行

Toshihiko v2 は v1 の TypeScript リファクタリングです。まずパッケージ構成と非同期構文を更新し、その後必要な場所で型を活用します。Model、Query、Yukari の概念は維持されています。

## 環境とパッケージ

Node.js 22 または 24 に更新し、scoped Adapter をインストールします。

```bash
npm install toshihiko@next @toshihiko/mysql-adapter@next
```

| v1 | v2 |
|---|---|
| `toshihiko` | `toshihiko` |
| 組み込み MySQL 依存 | `@toshihiko/mysql-adapter` |
| `toshihiko-redis` | `@toshihiko/redis-cache` |
| `toshihiko-memcached` | `@toshihiko/memcached-cache` |
| Adapter 基底 | `@toshihiko/base-adapter` |
| Cache 基底 | `@toshihiko/base-cache` |

MySQL Adapter をインストールすれば、従来の `mysql` dialect 文字列を使用できます。

## Model と Promise

`define(table, fields, options)` の形は変わりません。JavaScript 実行時は v1 フィールド別名を正規化します。TypeScript では `primaryKey`、`autoIncrement`、`allowNull`、`defaultValue` を使用します。

```typescript
const users = await User.where({ name: 'Alice' }).find();
await User.build({ name: 'Bob' }).insert();
```

Validator はメッセージまたはメッセージの Promise を返せます。

## カスタム Model メソッド

JavaScript の直接代入は引き続き動作します。TypeScript では `methods` に置くと、外部呼び出し、戻り値、メソッド内の `this` を推論できます。

```typescript
const User = database.define('users', userSchema, {
  methods: {
    findByName(name: string) {
      return this.where({ name }).findOne();
    },
  },
});
```

## ライフサイクルと Cache

`build()` は新規 Yukari を作成し、`insert()` 後も新規行のままです。更新と削除の前に検索し直します。Cache は scoped パッケージのインスタンスを直接構築する形を推奨します。

フィールドマッピング、複合主キー、クエリ演算子、Yukari 操作、Raw 実行、トランザクション、Redis・Memcached、カスタム Field Type をアプリケーションの統合テストで確認してください。
