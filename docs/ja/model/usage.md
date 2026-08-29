# Model の使用

Model は Yukari の構築と Query 作成の入口です。

## 行を構築する

```typescript
const user = User.build({ name: 'Alice' });
```

入力フィールドは Schema に存在する必要があり、値、デフォルト、任意性も Schema から推論されます。

## Query を作る

```typescript
User.where({ id: { $gte: 1 } });
User.fields(['id', 'name']);
User.orderBy({ id: 'desc' });
User.limit(20);
User.index('idx_users_name');
User.conn(connection);
```

Model から開始するたびに新しい Query が作られ、その後の Query メソッドは同じインスタンスを変更します。

## 読み取り

```typescript
const users = await User.find();
const user = await User.findOne();
const byId = await User.findById(1);
const json = await User.findById(1, true);
const count = await User.count();
```

複数行検索は配列、単一行検索は Yukari または `null` を返します。`true` を渡すと JSON オブジェクトを返します。

## 一括更新と削除

```typescript
await User.where({ active: false }).update({ archived: true });
await User.where({ archived: true }).delete();
```

これらは Query が表す行集合に作用し、単一 Yukari の操作とは異なります。戻り値は Adapter が定義します。

## 実行とトランザクション

`execute()` でデータベース固有コマンドを実行できます。`beginTransaction()`、`commit()`、`rollback()` は Adapter のトランザクションを公開し、Query には `.conn(connection)`、Yukari にはメソッド引数で接続を渡します。
