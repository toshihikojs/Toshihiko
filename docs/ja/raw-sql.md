# Raw SQL

Model と Query で表現できないデータベース操作には Raw 実行を使用します。アプリケーション値にはバインドパラメーターを優先してください。

```typescript
await database.execute(
  'SELECT * FROM `users` WHERE `user_id` = ?',
  [1],
);

await User.conn(connection).execute(
  'UPDATE `users` SET `name` = ? WHERE `user_id` = ?',
  ['Alice', 1],
);
```

トランザクションでは Model から接続を取得し、Query に渡します。アプリケーションコードが Adapter インスタンスを取得する必要はありません。

```typescript
const connection = await User.beginTransaction();
try {
  await User.conn(connection).execute('SELECT ?', [1]);
  await User.commit(connection);
} catch (error) {
  await User.rollback(connection);
  throw error;
}
```

## SQL ログ

`showSql` に `true` または関数を設定できます。Adapter は各文で `sql` イベント、プール接続の作成時に `log` イベントも発行します。

## Raw 式

MySQL 互換レイヤーは `{{value + 1}}` のような二重波括弧の更新式を認識します。Raw 式、順序文字列、インデックス名は SQL 構造なので、リクエスト値などの信頼できない入力を組み込まないでください。
