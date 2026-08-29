# `Field` and `Type`

A schema entry describes one logical property. `Model` compiles each entry into a `Field`, which delegates parsing, storage conversion, comparison, and JSON conversion to a Field Type.

## Field definition

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
```

| Property | Default | Description |
|---|---:|---|
| `name` | required | Logical property name |
| `column` | `name` | Storage column name; an empty string also falls back to `name` |
| `type` | `Type.String` | Value conversion contract |
| `validators` | `[]` | One validator or an array |
| `allowNull` | `false` | Adds `null` to the field value type |
| `primaryKey` | `false` | Includes the field in ID lookup and row locators |
| `autoIncrement` | `false` | Marks a storage-generated field |
| `defaultValue` | Field Type default | Value copied into rows built without this field |

An ordinary schema array literal retains field-level inference when passed directly to `define()`.

## Validators

```typescript
type FieldValidator<Value> = (
  value: Value,
) => string | void | Promise<string | void>;
```

Returning `undefined` or an empty string succeeds. A non-empty string becomes the rejection message. A nullable field accepts `null` before validators are called; a non-nullable field rejects it. Validator `this` is the Model.

## Compiled `Field`

```typescript
class Field<Definition extends FieldDefinitionShape = FieldDefinitionShape> {
  readonly options: Readonly<Definition>;
  readonly name: Definition['name'];
  readonly column: string;
  readonly type: FieldTypeFromDefinition<Definition>;
  readonly validators: readonly FieldValidator<FieldDefinitionNonNullValue<Definition>>[];
  readonly allowNull: boolean;
  readonly primaryKey: boolean;
  readonly autoIncrement: boolean;
  readonly default: FieldDefinitionValue<Definition> | undefined;
  readonly defaultValue: FieldDefinitionValue<Definition> | undefined;
  readonly needQuotes: boolean;

  parse(
    value: FieldDefinitionStorageValue<Definition>,
  ): FieldDefinitionValue<Definition>;
  restore(value: FieldDefinitionValue<Definition>): FieldDefinitionStorageValue<Definition>;
  readonly equal: (
    left: FieldDefinitionValue<Definition>,
    right: FieldDefinitionValue<Definition>,
  ) => boolean;
  toJSON(value: FieldDefinitionValue<Definition>): FieldDefinitionJsonValue<Definition>;
}
```

`equal()` and `toJSON()` use the Field Type implementation when present. Otherwise they use strict equality and return the value unchanged.

## Built-in `Type`

```typescript
import { Type } from 'toshihiko';

type StringStorageValue = string | number | bigint | boolean | null | undefined;
type BooleanStorageValue = string | number | boolean | null | undefined;
type NumberStorageValue = string | number;
type JsonStorageValue = string | JsonValue;
type DatetimeStorageValue = moment.MomentInput;
```

| Type | `parse()` input | Application value | `restore()` output | JSON value |
|---|---|---|---|---|
| `Type.String` | `StringStorageValue` | `string` | `string` | `string` |
| `Type.Boolean` | `BooleanStorageValue` | `boolean` | `number` | `boolean` |
| `Type.Integer` | `NumberStorageValue` | `number` | `number` | `number` |
| `Type.Float` | `NumberStorageValue` | `number` | `number` | `number` |
| `Type.Json` | `JsonStorageValue` | `JsonValue` | `string` | `JsonValue` |
| `Type.Datetime` | `DatetimeStorageValue` | `Date` | `string` | `string` |

`Type.String`, `Boolean`, `Integer`, `Float`, and `Json` provide defaults. `Datetime` does not.

## Custom Field Type

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

When `JsonValue` differs from `Value`, `toJSON()` is required.

```typescript
const LowercaseEmail = {
  name: 'LowercaseEmail',
  needQuotes: true,
  parse(value: string) {
    return value.toLowerCase();
  },
  restore(value: string) {
    return value.toLowerCase();
  },
} satisfies FieldType<string>;
```

The compiler verifies that `restore()` accepts the value produced by `parse()`, returns a storage value accepted by `parse()`, and that optional `equal()` and `toJSON()` receive the same application value type.

## Row inference types

| Type | Result |
|---|---|
| `RowFromSchema<Schema>` | Application values by logical field name |
| `JsonRowFromSchema<Schema>` | JSON values by logical field name |
| `PrimaryKeyNames<Schema>` | Union of primary-key field names |
| `FieldDefinitionValue<Definition>` | Application value, including `null` when allowed |
| `FieldDefinitionStorageValue<Definition>` | Value returned by `restore()` |
| `FieldDefinitionJsonValue<Definition>` | Value returned by `toJSON()` |
