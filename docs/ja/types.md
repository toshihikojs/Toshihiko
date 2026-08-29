# フィールド型

Field Type はデータベース保存値、Yukari のアプリケーション値、等価比較、JSON 出力を相互に変換します。

## 組み込み型

| 型 | Yukari の値 | 一般的な MySQL 保存先 |
|---|---|---|
| `Type.String` | `string` | `CHAR`、`VARCHAR`、`TEXT` |
| `Type.Boolean` | `boolean` | `TINYINT` |
| `Type.Integer` | `number` | 整数型 |
| `Type.Float` | `number` | `DECIMAL`、`FLOAT`、`DOUBLE` |
| `Type.Json` | JSON 値 | テキストまたは JSON 列 |
| `Type.Datetime` | `Date` | `DATETIME` |

`allowNull: true` は推論型に `null` を追加します。

## カスタム型

```typescript
interface IndustryValue {
  big: string;
  small: string;
}

const Industry = {
  name: 'Industry',
  needQuotes: true,
  parse(value: string): IndustryValue {
    const [big = '', small = ''] = value.split(',');
    return { big, small };
  },
  restore(value: IndustryValue): string {
    return `${value.big},${value.small}`;
  },
} satisfies FieldType<IndustryValue, string>;
```

`parse()` は保存値をアプリケーション値に、`restore()` は逆方向に変換します。アプリケーション型は `build()`、検索条件、Yukari、行型へ伝播します。

任意メンバーは `defaultValue`、`equal()`、`toJSON()`、`name`、`needQuotes` です。JSON 型が異なる場合は 3 番目の `FieldType` 型引数を使用します。
