# パッケージ

Monorepo の各パッケージは、独立した公開 API とリリース境界を持ちます。

| パッケージ | 役割 |
|---|---|
| `toshihiko` | Model、Query、Yukari、Field Type、公開契約。 |
| `@toshihiko/mysql-adapter` | `mysql2` Promise Pool を使う MySQL Adapter。 |
| `@toshihiko/base-adapter` | Adapter 作成用の基底クラスとツール。 |
| `@toshihiko/redis-cache` | `ioredis` を使う Redis Cache。 |
| `@toshihiko/memcached-cache` | Memcached Cache。 |
| `@toshihiko/base-cache` | イベント対応 Cache 基底クラス。 |
| `@toshihiko/sql-utils` | SQL 名マッピングとエスケープ。 |

## コアと MySQL

```bash
npm install toshihiko @toshihiko/mysql-adapter
```

MySQL Adapter はプール、バインド値、SQL 生成、挿入後の読み戻し、トランザクション、Cache 連携、SQL ログを担当し、CI では MySQL 5.7 と 8.4 を検証します。

## Cache パッケージ

```bash
npm install @toshihiko/redis-cache
# または
npm install @toshihiko/memcached-cache
```

一般的なアプリケーションはコア、1 つの具体的 Adapter、必要なら 1 つの具体的 Cache に依存します。Base パッケージは主に拡張機能の作者向けです。

`@toshihiko/sql-utils` は `sqlNameToColumn()`、`escape()`、`escapeLike()` を公開します。可能な場合は手動エスケープよりドライバーのバインド値を使用してください。
