# `Field` 与 `Type`

Schema 条目描述一个逻辑属性。Model 会把它编译成 `Field`，并由 Field Type 负责解析、存储转换、比较和 JSON 转换。

## 字段定义

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

## 内置 `Type`

| Type | `parse()` 输入 | 应用值 | `restore()` 输出 | JSON 值 |
|---|---|---|---|---|
| `Type.String` | `unknown` | `string` | `string` | `string` |
| `Type.Boolean` | `unknown` | `boolean` | `number` | `boolean` |
| `Type.Integer` | `unknown` | `number` | `number` | `number` |
| `Type.Float` | `unknown` | `number` | `number` | `number` |
| `Type.Json` | `unknown` | `JsonValue` | `string` | `JsonValue` |
| `Type.Datetime` | `unknown` | `Date` | `string` | `string` |

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

## 类型展开

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
