# `Field` 与 `Type`

Schema 条目描述一个逻辑属性。Model 会把它编译成 `Field`，并由 Field Type 负责解析、存储转换、比较和 JSON 转换。

## 字段定义

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

| 属性 | 默认值 | 说明 |
|---|---:|---|
| `name` | 必填 | 逻辑字段名 |
| `column` | `name` | 存储列名 |
| `type` | `Type.String` | 值转换契约 |
| `validators` | `[]` | 一个或多个校验器 |
| `allowNull` | `false` | 是否允许 `null` |
| `primaryKey` | `false` | 是否参与主键查询和行定位 |
| `autoIncrement` | `false` | 是否由数据库生成 |
| `defaultValue` | Type 默认值 | `build()` 未传字段时复制的值 |

直接传给 `define()` 的普通数组字面量会保留字段级推断。

## 校验器

```typescript
type FieldValidator<Value> = (
  value: Value,
) => string | void | Promise<string | void>;
```

返回空字符串或 `undefined` 表示通过；非空字符串会成为错误信息。校验器的 `this` 是 Model。

## 编译后的 `Field`

公开属性包括 `name`、`column`、`type`、`allowNull`、`primaryKey`、`autoIncrement`、`validators`、`defaultValue`、`needQuotes` 和 `options`。

```typescript
field.parse(storageValue): FieldValue
field.restore(value): StorageValue
field.equal(left, right): boolean
field.toJSON(value): JsonValue
```

## 内置 `Type`

| Type | 应用值 | 存储转换 |
|---|---|---|
| `Type.String` | `string` | `String(value)` |
| `Type.Boolean` | `boolean` | `0` 或 `1` |
| `Type.Integer` | `number` | `parseInt(value)` |
| `Type.Float` | `number` | `parseFloat(value)` |
| `Type.Json` | `JsonValue` | `JSON.stringify(value)` |
| `Type.Datetime` | `Date` | `YYYY-MM-DD HH:mm:ss` |

## 自定义 Field Type

```typescript
type FieldType<Value, StorageValue = Value, JsonValue = Value> = {
  name?: string;
  needQuotes?: boolean;
  defaultValue?: Value;
  parse(value: StorageValue): Value;
  restore(value: Value): StorageValue;
  equal?(left: Value, right: Value): boolean;
  toJSON?(value: Value): JsonValue;
};
```

TypeScript 会检查 `parse()`、`restore()`、`equal()` 与 `toJSON()` 的值类型是否一致。行推断可使用 `RowFromSchema`、`JsonRowFromSchema`、`PrimaryKeyNames` 和各类 `FieldDefinition*Value` 辅助类型。
