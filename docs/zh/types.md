# 字段类型

Field Type 在数据库存储值、Yukari 应用值、相等比较和 JSON 输出之间转换。

## 内置类型

| 类型 | Yukari 值 | 常见 MySQL 存储 |
|---|---|---|
| `Type.String` | `string` | `CHAR`、`VARCHAR`、`TEXT` |
| `Type.Boolean` | `boolean` | `TINYINT` |
| `Type.Integer` | `number` | 整数类型 |
| `Type.Float` | `number` | `DECIMAL`、`FLOAT`、`DOUBLE` |
| `Type.Json` | JSON 值 | 文本或 JSON 列 |
| `Type.Datetime` | `Date` | `DATETIME` |

`allowNull: true` 会把 `null` 加入推断类型。

## 自定义类型

```typescript
import type { FieldType } from 'toshihiko';

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

`parse()` 把存储值变为应用值，`restore()` 做反向转换。应用值会传播到 `build()`、查询条件、Yukari 和行类型辅助工具。

可选成员包括 `defaultValue`、`equal()`、`toJSON()`、`name` 和 `needQuotes`。如果 JSON 类型与应用类型不同，请使用第三个 `FieldType` 泛型：

```typescript
const Identifier = {
  parse: (value: string) => BigInt(value),
  restore: (value: bigint) => value.toString(),
  toJSON: (value: bigint) => value.toString(),
} satisfies FieldType<bigint, string, string>;
```
