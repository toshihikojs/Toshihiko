# `Query`

Query は 1 回のデータベース操作を表します。Builder メソッドは現在の Query を変更し、同じインスタンスを返します。独立した状態が必要なら Model から別の chain を開始してください。

## `where()`

```typescript
query.where(condition: QueryWhere<Row>): this
```

現在の条件を置き換えます。前回の条件とは merge しません。

```typescript
User.where({
  $or: [
    { name: { $like: 'A%' } },
    { id: { $between: [10, 20] } },
  ],
});
```

`$eq`、`$neq`、`$gt`、`$gte`、`$lt`、`$lte`、`$between`、`$in`、`$like`、`$and`、`$or` を利用できます。`===`、`!==`、`>`、`>=`、`<`、`<=` も互換形式です。

## フィールド、順序、制限、接続

```typescript
query.fields(fields): this
query.field(fields): this
query.order(order): this
query.orderBy(order): this
query.limit(count): this
query.limit(offset, count): this
query.index(name): this
query.conn(connection): this
```

`field()` と `orderBy()` は互換エイリアスです。フィールド配列と順序 object には Schema のフィールド名チェックが働きます。`conn()` には `beginTransaction()` が返した接続を渡します。

## `find()`

```typescript
find(): Promise<readonly QueriedYukari[]>
find({ single: true }): Promise<QueriedYukari | null>
find(true): Promise<readonly QueryJsonRow[]>
find({ single: true }, true): Promise<QueryJsonRow | null>
```

| オプション | 初期値 | 動作 |
|---|---:|---|
| `toJSON` | `false` | シリアライズ済み object を返す |
| `single` | `false` | 1 行だけ返し、存在しなければ `null` |
| `noCache` | `false` | この読み取りでは Cache を使わない |

boolean と options object は互換の引数順序を利用できます。リテラル `true` が戻り値の型を決定します。

## `findOne()` と `findById()`

```typescript
findOne(toJSON?): Promise<Row | null>
findById(id, toJSON?): Promise<Row | null>
```

複合主キーは object を使います。Cache 読み取りエラーはデータベースへの fallback になります。

## count と書き込み

```typescript
query.count(): Promise<number>
query.update(data: Partial<Row>): Promise<Result>
query.delete(): Promise<Result>
query.execute(...args): Promise<Result>
```

`update()` と `delete()` は現在の条件、順序、制限を利用します。`execute()` は `conn()` で設定した接続を利用します。具体的な戻り値はバックエンドから推論されます。

公開型として `QueryWhere`、`QueryFieldOperators`、`QueryOrder`、`QueryFindOptions`、`QueryJsonRow`、`FindByIdInput` を利用できます。
