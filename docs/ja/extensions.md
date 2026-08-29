# 拡張機能の作成

Toshihiko はデータベース Adapter と Cache の型付き契約を公開します。再利用可能な拡張には Base パッケージを使用します。

## Adapter を作る

```typescript
class ExampleAdapter extends Adapter<ExampleOptions> {
  override async find(
    query: AdapterQuery,
    options?: AdapterFindOptions,
  ): Promise<readonly AdapterRow[] | AdapterRow | null> {
    const rows = await runDatabaseQuery(query);
    return options?.single ? rows[0] ?? null : rows;
  }

  override getDBName(): string {
    return this.options.database;
  }
}

const database = new Toshihiko(ExampleAdapter, { database: 'app' });
```

Toshihiko はコンストラクターを `(toshihiko, options)` で呼び出します。Adapter は `find`、`count`、`insert`、`update`、`updateByQuery`、`deleteByQuery`、`execute`、トランザクションメソッドを実装できます。上書きされていない Base メソッドは未実装エラーになります。

ジェネリックで Model、Connection、Field、Value、Query、結果型を個別に宣言できます。`define()` はコア Model と Query が Adapter 契約を満たすことを検証します。

## Cache を作る

Cache は `getData()`、`setData()`、`deleteData()`、`deleteKeys()` の 4 メソッドを実装します。Base Cache はイベント機能を提供しますが、キー、シリアライズ、バッチ、期限、クライアント構築は規定しません。

`getData()` は要求されたキー順を維持し、miss に `null` を返す必要があります。

## テスト

拡張機能には型テスト、成功・空結果・失敗の単体テスト、対応サービスでの統合テスト、ビルド済み package entry を使うコンシューマーコンパイルを用意してください。
