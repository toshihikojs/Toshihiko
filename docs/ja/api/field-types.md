# `Field` と `Type`

Schema entry は 1 つの論理プロパティを表します。Model は entry を `Field` にコンパイルし、Field Type が parse、保存形式への変換、比較、JSON 変換を担当します。

## Field 定義

```typescript
interface FieldDefinition {
  name: string;
  column?: string;
  type?: FieldType;
  validators?: FieldValidator | readonly FieldValidator[];
  allowNull?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  defaultValue?: FieldValue;
}
```

| プロパティ | 初期値 | 説明 |
|---|---:|---|
| `name` | 必須 | 論理フィールド名 |
| `column` | `name` | 保存列名 |
| `type` | `Type.String` | 値変換契約 |
| `validators` | `[]` | 1 つまたは複数の Validator |
| `allowNull` | `false` | `null` を許可 |
| `primaryKey` | `false` | ID 検索と行特定に使用 |
| `autoIncrement` | `false` | データベース生成フィールド |
| `defaultValue` | Type の初期値 | `build()` で省略した場合にコピー |

`define()` に通常の配列リテラルを直接渡すと、フィールド単位の推論が保持されます。

## Validator

```typescript
type FieldValidator<Value> = (
  value: Value,
) => string | void | Promise<string | void>;
```

空文字列または `undefined` は成功です。空でない文字列はエラーメッセージになります。Validator の `this` は Model です。

## コンパイル済み `Field`

公開プロパティは `name`、`column`、`type`、`allowNull`、`primaryKey`、`autoIncrement`、`validators`、`defaultValue`、`needQuotes`、`options` です。

```typescript
field.parse(storageValue): FieldValue
field.restore(value): StorageValue
field.equal(left, right): boolean
field.toJSON(value): JsonValue
```

## 組み込み `Type`

| Type | アプリケーション値 | 保存変換 |
|---|---|---|
| `Type.String` | `string` | `String(value)` |
| `Type.Boolean` | `boolean` | `0` または `1` |
| `Type.Integer` | `number` | `parseInt(value)` |
| `Type.Float` | `number` | `parseFloat(value)` |
| `Type.Json` | `JsonValue` | `JSON.stringify(value)` |
| `Type.Datetime` | `Date` | `YYYY-MM-DD HH:mm:ss` |

## カスタム Field Type

`FieldType<Value, StorageValue, JsonValue>` は `parse()`、`restore()`、任意の `equal()` と `toJSON()` を定義します。TypeScript は各関数の入出力が同じ application value 型に沿うことを検査します。

行の推論には `RowFromSchema`、`JsonRowFromSchema`、`PrimaryKeyNames`、各 `FieldDefinition*Value` 型を利用できます。
