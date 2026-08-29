# クエリ

Query メソッドはチェーン可能で、論理フィールド名と値は Model Schema に対して型チェックされます。

## 条件

```typescript
User.where({
  id: { $gte: 10 },
  name: { $like: 'A%' },
});
```

| 演算子 | 意味 |
|---|---|
| `$eq`、`===` | 等しい |
| `$neq`、`!==` | 等しくない |
| `$gt`、`>` | より大きい |
| `$gte`、`>=` | 以上 |
| `$lt`、`<` | より小さい |
| `$lte`、`<=` | 以下 |
| `$in` | 値配列に含まれる |
| `$between` | 2 値の範囲内 |
| `$like` | SQL `LIKE` |
| `$and` | AND 結合 |
| `$or` | OR 結合 |

```typescript
User.where({
  $or: [{ name: 'Alice' }, { name: 'Bob' }],
  active: true,
});
```

MySQL Adapter は値をバインドします。順序文字列、インデックス名、Raw 式は SQL 構造なので、信頼できるアプリケーションコードからのみ指定してください。

## 順序、フィールド、件数

```typescript
User.orderBy({ id: 'desc', name: 'asc' });
User.order('id DESC');
User.fields(['id', 'name']);
User.limit(20);
User.limit(40, 20);
User.limit([40, 20]);
User.limit('40,20');
```

数値の順序は `1` が昇順、`-1` が降順です。`field()` は `fields()` の別名です。

## 戻り値

```typescript
await User.find();
await User.find({ noCache: true });
await User.find({ single: true });
await User.find(true, { noCache: true });
await User.findOne(true);
```

`single` は Yukari または `null`、`noCache` はその検索だけ Cache 読み取りを迂回し、真偽値引数は JSON 変換を制御します。

Query は可変状態を保持します。独立した条件が必要なら Model から新しい Query を作ってください。
