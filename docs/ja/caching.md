# キャッシュ

Cache はデータベース全体または 1 つの Model に設定できます。コアは Cache 契約を定義し、具体的な Adapter が読み取り、補完、無効化の経路を実装します。

```typescript
const cache = new MemcachedCache('127.0.0.1:11211', { prefix: 'app:' });
const database = new Toshihiko('mysql', { cache, database: 'app' });

const CachedUser = database.define('users', userSchema);
const UncachedAudit = database.define('audit', auditSchema, { cache: false });
```

Model はデータベース Cache を継承し、別のインスタンスで置換するか、`false` または `null` で無効化できます。

## Cache 契約

| メソッド | 役割 |
|---|---|
| `getData(database, table, keys)` | 1 件以上の行を取得。 |
| `setData(database, table, key, data)` | 1 行を保存。 |
| `deleteData(database, table, key)` | 1 キーを削除。 |
| `deleteKeys(database, table, keys)` | 複数キーを削除。 |

複数取得は入力順を維持し、miss を `null` で表します。

## 読み取りと無効化

`findById()` は主キー条件で Cache を先に確認し、hit を検索済み Yukari に復元します。miss の場合は Adapter へ進みます。`find({ noCache: true })` はその検索だけ Cache 読み取りを迂回します。

MySQL Adapter は更新と削除の前に関連する主キーを無効化します。Cache 読み取りエラーは `findById()` では miss として扱い、データベース処理を継続します。

Redis と Memcached は同じ契約を実装しながら、クライアント設定、バッチ、イベント、キー形式を維持します。Memcached は `setCustomizeKeyFunc()` で既存キー形式に対応できます。
