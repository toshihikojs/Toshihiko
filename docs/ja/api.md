# API リファレンス

API リファレンスは利用者別に分かれています。アプリケーションコードは Application API から読み始め、データベースやキャッシュの拡張を作る場合だけ Extension API を参照してください。

以下のページでは、公開 API を利用場面ごとに例とともに説明します。すべての export や正確なジェネリックシグネチャを確認する場合は、TypeScript ソースから生成された<a href="/Toshihiko/ja/typedoc/" target="_self">日本語の型インデックス</a>を参照してください。

## アプリケーション API

```text
Toshihiko
└── define() が Model を返す
    ├── where() などが Query を返す
    └── build() または検索が Yukari を返す
```

| ページ | 内容 |
|---|---|
| [Toshihiko](api/toshihiko) | データベース設定、`define()`、Raw 実行 |
| [Model](api/model) | Schema、カスタムメソッド、クエリ入口、トランザクション |
| [Query](api/query) | 条件、フィールド、順序、制限、読み書き |
| [Yukari](api/yukari) | 行、検証、永続化、シリアライズ |
| [Field と Type](api/field-types) | Schema 定義、組み込み型、Validator、カスタム型 |

## 拡張 API

以下は Adapter と Cache の開発者向けです。既存 Adapter を使うアプリケーションには不要です。

| ページ | パッケージ |
|---|---|
| [Adapter](api/adapter) | `toshihiko`、`@toshihiko/base-adapter` |
| [Cache](api/cache) | Cache 契約、基底クラス、Redis、Memcached |
| [MySQL Adapter](api/mysql) | `@toshihiko/mysql-adapter` |
| [SQL ユーティリティ](api/sql-utils) | `@toshihiko/sql-utils` |

## 表記規則

- シグネチャは公開 TypeScript API を示します。
- データベースや Cache に到達する処理は Promise を返します。
- `readonly` は型契約であり、実行時の freeze ではありません。
- 互換エイリアスは明記し、例では主となる書き方を使います。
