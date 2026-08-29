# 開発とテスト

## ローカル検証

```bash
npm install --global @microsoft/rush@5.172.1
rush update
rush check
rush build
rush typecheck
rush test
```

通常の単体テストと package entry テストには Docker や外部サービスは不要です。

## カバレッジ

```bash
rush test:coverage
```

各パッケージは独自の `coverage/lcov.info` を生成し、CI は別々の Codecov flag でアップロードします。カバレッジはそのコマンドで実行されたコードを示すもので、実 MySQL、Redis、Memcached の使用を意味しません。

## サービス統合

CI は MySQL 5.7、MySQL 8.4、Redis、Memcached で統合テストを実行します。互換サービスがローカルにある場合は `MYSQL_*`、`REDIS_*`、`MEMCACHED_*` 環境変数を設定して `rush test:integration` を実行します。

公開動作の変更では、型テスト、実行時回帰、package consumer を一緒に更新し、公開パッケージへの変更には Rush change file を追加します。
