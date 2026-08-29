# `Field` と `Type`

Schema entry は 1 つの論理プロパティを表します。Model は entry を `Field` にコンパイルし、Field Type が parse、保存形式への変換、比較、JSON 変換を担当します。

## Field 定義

```typescript
interface FieldDefinition<
  Name extends string = string,
  FieldTypeDefinition extends FieldTypeLike = FieldTypeLike,
> {
  readonly name: Name;
  column?: string;
  type?: FieldTypeDefinition;
  validators?:
    | FieldValidator<FieldTypeValue<FieldTypeDefinition>>
    | readonly FieldValidator<FieldTypeValue<FieldTypeDefinition>>[];
  allowNull?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  defaultValue?: FieldTypeValue<FieldTypeDefinition>;
}

type SchemaDefinition = readonly FieldDefinitionShape[];
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

```typescript
class Field<Definition extends FieldDefinitionShape = FieldDefinitionShape> {
  readonly options: Readonly<Record<string, unknown>>;
  readonly name: Definition['name'];
  readonly column: string;
  readonly type: FieldTypeFromDefinition<Definition>;
  readonly validators: readonly FieldValidator<
    FieldDefinitionNonNullValue<Definition>
  >[];
  readonly allowNull: boolean;
  readonly primaryKey: boolean;
  readonly autoIncrement: boolean;
  readonly default: FieldDefinitionValue<Definition> | undefined;
  readonly defaultValue: FieldDefinitionValue<Definition> | undefined;
  readonly needQuotes: boolean;

  parse(value: unknown): FieldDefinitionValue<Definition>;
  restore(
    value: FieldDefinitionValue<Definition>,
  ): FieldDefinitionStorageValue<Definition>;
  readonly equal: (
    left: FieldDefinitionValue<Definition>,
    right: FieldDefinitionValue<Definition>,
  ) => boolean;
  toJSON(
    value: FieldDefinitionValue<Definition>,
  ): FieldDefinitionJsonValue<Definition>;
}
```

## 組み込み `Type`

| Type | `parse()` 入力 | アプリケーション値 | `restore()` 出力 | JSON 値 |
|---|---|---|---|---|
| `Type.String` | `unknown` | `string` | `string` | `string` |
| `Type.Boolean` | `unknown` | `boolean` | `number` | `boolean` |
| `Type.Integer` | `unknown` | `number` | `number` | `number` |
| `Type.Float` | `unknown` | `number` | `number` | `number` |
| `Type.Json` | `unknown` | `JsonValue` | `string` | `JsonValue` |
| `Type.Datetime` | `unknown` | `Date` | `string` | `string` |

## カスタム Field Type

`FieldType<Value, StorageValue, JsonValue>` は `parse()`、`restore()`、任意の `equal()` と `toJSON()` を定義します。TypeScript は各関数の入出力が同じ application value 型に沿うことを検査します。

行の推論には `RowFromSchema`、`JsonRowFromSchema`、`PrimaryKeyNames`、各 `FieldDefinition*Value` 型を利用できます。

```typescript
type RowFromSchema<Schema extends SchemaDefinition> = {
  [Definition in Schema[number] as Definition['name']]:
    FieldDefinitionValue<Definition>;
};

type JsonRowFromSchema<Schema extends SchemaDefinition> = {
  [Definition in Schema[number] as Definition['name']]:
    FieldDefinitionJsonValue<Definition>;
};

type PrimaryKeyNames<Schema extends SchemaDefinition> = Extract<
  Schema[number],
  { readonly primaryKey: true }
>['name'];
```
