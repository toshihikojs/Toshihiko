# Data types

Field types translate values between database storage, Yukari properties, equality checks, and JSON output.

## Built-in types

| Type | Yukari value | Typical MySQL storage |
|---|---|---|
| `Type.String` | `string` | `CHAR`, `VARCHAR`, `TEXT` |
| `Type.Boolean` | `boolean` | `TINYINT` |
| `Type.Integer` | `number` | integer types |
| `Type.Float` | `number` | `DECIMAL`, `FLOAT`, `DOUBLE` |
| `Type.Json` | JSON value | text or JSON columns |
| `Type.Datetime` | `Date` | `DATETIME` or compatible values |

`allowNull: true` adds `null` to the field's inferred value type.

## Custom types

A custom type defines `parse()` and `restore()`. `parse()` converts a storage value into the application value; `restore()` converts it back for the Adapter.

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

Use it like a built-in type:

```typescript
const Company = database.define('companies', [
  { name: 'id', type: Type.Integer, primaryKey: true },
  { name: 'industry', type: Industry },
]);

const company = Company.build({
  id: 1,
  industry: { big: 'internet', small: 'financial' },
});
```

The custom value type flows into `build()`, Query conditions, Yukari properties, and inferred row helpers.

## Optional methods and properties

| Member | Purpose |
|---|---|
| `name` | Human-readable type name. |
| `needQuotes` | Indicates whether legacy SQL builders quote restored values. |
| `defaultValue` | Default copied into a new Yukari when the field has no field-level default. |
| `equal(left, right)` | Compares current and original values during updates. Strict equality is the fallback. |
| `toJSON(value)` | Converts the application value to its JSON representation. |

When `toJSON()` changes the output type, include the JSON type as the third `FieldType` parameter:

```typescript
const Identifier = {
  parse(value: string) {
    return BigInt(value);
  },
  restore(value: bigint) {
    return value.toString();
  },
  toJSON(value: bigint) {
    return value.toString();
  },
} satisfies FieldType<bigint, string, string>;
```
