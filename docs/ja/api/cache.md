# Cache API

このページは主に Cache パッケージと Adapter の開発者向けです。Cache はデータベース、テーブル、キーごとに完全な行 object を保存します。

## コア契約

```typescript
interface Cache {
  getData<Value extends object>(database: string, table: string,
    keys: CacheKey | readonly CacheKey[]): Promise<(Value | null)[]>;
  setData<Value extends object>(database: string, table: string,
    key: CacheKey, data: Value): Promise<void | boolean | 'OK' | null>;
  deleteData(database: string, table: string,
    key: CacheKey): Promise<void | boolean | number>;
  deleteKeys(database: string, table: string,
    keys: readonly CacheKey[]): Promise<void | readonly number[]>;
}
```

`CacheKey` は object または primitive です。object は複合キーを表します。miss を表現できる実装は `null` を使い、入力順序を保持します。

## 設定

Toshihiko と Model は既存 Cache または `module`、`path`、`name` を含む module 形式の設定を受け付けます。解決順は `module`、`path`、`name` です。`name: 'redis'` は `@toshihiko/redis-cache` を読み込みます。

Model の `cache: false` または `cache: null` は継承を無効にします。省略するとデータベース Cache を継承します。

## `@toshihiko/base-cache`

`Cache` 基底クラスは Node.js `EventEmitter` を継承し、4 操作を abstract contract として残します。キー形式、シリアライズ、batch、期限、client 作成方法は規定しません。

## Redis Cache

```typescript
new RedisCache(servers, options?, client?)
create(servers, options?)
```

`RedisCacheOptions` は `ioredis` options に `prefix` を追加します。公開プロパティは `prefix` と `redis` です。データは JSON で保存され、既存 client を注入できます。

## Memcached Cache

```typescript
new MemcachedCache(servers, options?, client?)
create(servers, options?)
```

options は `prefix` と `customizeKey` を追加します。公開メンバーは `memcached`、`servers`、`options`、`prefix`、`setCustomizeKeyFunc()` です。`failure` と `reconnecting` event は Cache から再送されます。

キー生成の詳細は実装内部です。利用者は 4 つの Cache 操作の結果だけを観察します。

## 失敗時の動作

`Query.findById()` は Cache 読み取りエラーを miss として扱います。MySQL Adapter も Cache の lookup または population が失敗した場合にデータベースへ fallback します。mutation 前の invalidation は Adapter が担当します。
