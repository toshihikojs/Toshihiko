# トランザクション

トランザクションは具体的な Adapter が提供します。MySQL Adapter はプールから 1 つの接続を取得し、commit または rollback で解放します。

```typescript
const connection = await User.beginTransaction();

try {
  await User.build({ name: 'Alice' }).insert(connection);
  await User.where({ id: 1 }).conn(connection).update({ name: 'Bob' });
  await User.commit(connection);
} catch (error) {
  await User.rollback(connection);
  throw error;
}
```

トランザクションを開始しても後続の Model 呼び出しには自動的に結び付きません。同じトランザクションに含める Query は `.conn(connection)`、Yukari 書き込みはメソッド引数、Adapter の Raw 実行は最初の引数で接続を受け取ります。

接続型は Adapter から推論されるため、別の Adapter の接続は TypeScript で拒否されます。トランザクションメソッドは Adapter が実装している場合だけ利用できます。
