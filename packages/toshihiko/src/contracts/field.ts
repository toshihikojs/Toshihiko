import { Type } from '../field-types';

const cloneDeep = require('lodash/cloneDeep') as <Value>(value: Value) => Value;
const otrans = require('otrans') as {
  toCamel(value: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>>;
};

declare const fieldTypeValue: unique symbol;
declare const fieldTypeStorageValue: unique symbol;
declare const fieldTypeJsonValue: unique symbol;

type SameType<Left, Right> =
  [Left] extends [Right]
    ? [Right] extends [Left] ? true : false
    : false;

type FieldTypeJsonMethod<Value, JsonValue> = SameType<Value, JsonValue> extends true
  ? { readonly toJSON?: (value: Value) => JsonValue }
  : { readonly toJSON: (value: Value) => JsonValue };

export type FieldType<
  Value,
  StorageValue = Value,
  JsonValue = Value,
> = {
  readonly [fieldTypeValue]?: Value;
  readonly [fieldTypeStorageValue]?: StorageValue;
  readonly [fieldTypeJsonValue]?: JsonValue;
  readonly name?: string;
  readonly needQuotes?: boolean;
  readonly defaultValue?: Value;
  parse(value: StorageValue): Value;
  restore(value: Value): StorageValue;
  equal?(left: Value, right: Value): boolean;
} & FieldTypeJsonMethod<Value, JsonValue>;

export interface FieldTypeLike {
  readonly [fieldTypeValue]?: unknown;
  readonly [fieldTypeStorageValue]?: unknown;
  readonly [fieldTypeJsonValue]?: unknown;
  readonly name?: string;
  readonly needQuotes?: boolean;
  readonly defaultValue?: unknown;
  parse(value: never): unknown;
  restore(value: never): unknown;
  equal?(left: never, right: never): boolean;
  toJSON?(value: never): unknown;
}

export type FieldTypeValue<Type extends FieldTypeLike> =
  typeof fieldTypeValue extends keyof Type
    ? Exclude<Type[typeof fieldTypeValue], undefined>
    : ReturnType<Type['parse']>;

export type FieldTypeStorageValue<Type extends FieldTypeLike> =
  ReturnType<Type['restore']>;

export type FieldValidator<Value> = (
  value: Value,
) => string | void | Promise<string | void>;

type FieldValidatorShape = {
  validate(value: never): string | void | Promise<string | void>;
}['validate'];

export interface FieldDefinitionShape {
  readonly name: string;
  readonly column?: string;
  readonly type?: FieldTypeLike;
  readonly validators?:
    | FieldValidatorShape
    | readonly FieldValidatorShape[];
  readonly allowNull?: boolean;
  readonly primaryKey?: boolean;
  readonly autoIncrement?: boolean;
  readonly defaultValue?: unknown;
}

export interface FieldDefinition<
  Name extends string = string,
  FieldTypeDefinition extends FieldTypeLike = FieldTypeLike,
> extends FieldDefinitionShape {
  readonly name: Name;
  readonly column?: string;
  readonly type?: FieldTypeDefinition;
  readonly validators?:
    | FieldValidator<FieldTypeValue<FieldTypeDefinition>>
    | readonly FieldValidator<FieldTypeValue<FieldTypeDefinition>>[];
  readonly allowNull?: boolean;
  readonly primaryKey?: boolean;
  readonly autoIncrement?: boolean;
  readonly defaultValue?: FieldTypeValue<FieldTypeDefinition> | undefined;
}

export type SchemaDefinition = readonly FieldDefinitionShape[];

export type FieldTypeFromDefinition<Definition extends FieldDefinitionShape> =
  Definition extends { readonly type: infer FieldTypeDefinition extends FieldTypeLike }
    ? FieldTypeDefinition
    : typeof Type.String;

type NullableValue<Definition extends FieldDefinitionShape> =
  Definition extends { readonly allowNull: true } ? null : never;

export type FieldDefinitionValue<Definition extends FieldDefinitionShape> =
  | FieldTypeValue<FieldTypeFromDefinition<Definition>>
  | NullableValue<Definition>;

export type FieldDefinitionNonNullValue<Definition extends FieldDefinitionShape> =
  FieldTypeValue<FieldTypeFromDefinition<Definition>>;

export type FieldDefinitionStorageValue<Definition extends FieldDefinitionShape> =
  FieldTypeStorageValue<FieldTypeFromDefinition<Definition>>;

export type FieldDefinitionJsonValue<Definition extends FieldDefinitionShape> =
  null extends FieldDefinitionValue<Definition>
    ? FieldTypeJsonValue<FieldTypeFromDefinition<Definition>> | null
    : FieldTypeJsonValue<FieldTypeFromDefinition<Definition>>;

type FieldTypeJsonValue<Type extends FieldTypeLike> =
  typeof fieldTypeJsonValue extends keyof Type
    ? Exclude<Type[typeof fieldTypeJsonValue], undefined>
    : Type extends { toJSON(value: never): infer JsonValue }
      ? JsonValue
      : FieldTypeValue<Type>;

export type JsonRowFromSchema<Schema extends SchemaDefinition> = {
  [Definition in Schema[number] as Definition['name']]:
    FieldDefinitionJsonValue<Definition>;
};

export type ValidatedFieldDefinition<Definition extends FieldDefinitionShape> = Omit<
  Definition,
  'defaultValue' | 'type' | 'validators'
> & {
  readonly type?: Definition extends {
    readonly type: infer FieldTypeDefinition extends FieldTypeLike;
  }
    ? ValidatedFieldType<FieldTypeDefinition>
    : FieldTypeLike;
  readonly defaultValue?: FieldDefinitionValue<Definition> | undefined;
  readonly validators?:
    | FieldValidator<FieldDefinitionNonNullValue<Definition>>
    | readonly FieldValidator<FieldDefinitionNonNullValue<Definition>>[];
};

type HasValidEqual<Type extends FieldTypeLike, Value> =
  Type extends { equal(left: infer Left, right: infer Right): boolean }
    ? SameType<Left, Value> extends true
      ? SameType<Right, Value>
      : false
    : true;

type HasValidToJSON<Type extends FieldTypeLike, Value> =
  Type extends { toJSON(value: infer Input): unknown }
    ? SameType<Input, Value>
    : true;

export type ValidatedFieldType<Type extends FieldTypeLike> =
  Type extends {
    parse(value: infer StorageValue): infer Value;
    restore(value: infer RestoredValue): infer RestoredStorageValue;
  }
    ? SameType<RestoredValue, Value> extends true
      ? RestoredStorageValue extends StorageValue
        ? HasValidEqual<Type, Value> extends true
          ? HasValidToJSON<Type, Value> extends true ? Type : never
          : never
        : never
      : never
    : never;

export type ValidatedSchema<Schema extends SchemaDefinition> = {
  readonly [Index in keyof Schema]: Schema[Index] extends FieldDefinitionShape
    ? ValidatedFieldDefinition<Schema[Index]>
    : never;
};

export type RowFromSchema<Schema extends SchemaDefinition> = {
  [Definition in Schema[number] as Definition['name']]: FieldDefinitionValue<Definition>;
};

export type PrimaryKeyNames<Schema extends SchemaDefinition> = Extract<
  Schema[number],
  { readonly primaryKey: true }
>['name'];

export class Field<
  Definition extends FieldDefinitionShape = FieldDefinitionShape,
> {
  declare readonly options: Readonly<Record<string, unknown>>;
  declare readonly name: Definition['name'];
  declare readonly column: string;
  declare readonly type: FieldTypeFromDefinition<Definition>;
  declare readonly validators: readonly FieldValidator<FieldDefinitionNonNullValue<Definition>>[];
  declare readonly allowNull: boolean;
  declare readonly primaryKey: boolean;
  declare readonly autoIncrement: boolean;
  declare readonly default: FieldDefinitionValue<Definition> | undefined;

  constructor(definition: Definition & ValidatedFieldDefinition<Definition>) {
    if (!definition.name) {
      throw new Error('no field name specified.');
    }

    const normalized = normalizeDefinition(definition);
    const candidateType = normalized.type as FieldTypeLike | undefined;
    const type = (isRuntimeFieldType(candidateType) ? candidateType : Type.String) as FieldTypeFromDefinition<Definition>;
    const validators = normalizeValidators<FieldDefinitionNonNullValue<Definition>>(
      normalized.validators as
        | FieldValidator<FieldDefinitionNonNullValue<Definition>>
        | readonly FieldValidator<FieldDefinitionNonNullValue<Definition>>[]
        | undefined,
    );
    if (typeof normalized.validators === 'function') {
      (normalized as { validators?: unknown }).validators = validators;
    }
    const autoIncrement = normalized.autoIncrement === undefined
      ? false
      : Boolean(normalized.autoIncrement);
    const defaultValue = resolveDefaultValue(
      normalized as Definition,
      type,
    );
    const runtimeType = type as FieldTypeLike;
    Object.defineProperties(this, {
      allowNull: { enumerable: true, value: Boolean(normalized.allowNull) },
      autoIncrement: { enumerable: true, value: autoIncrement },
      column: { enumerable: true, value: normalized.column || normalized.name },
      default: { enumerable: true, value: defaultValue },
      equal: {
        value: runtimeType.equal === undefined
          ? Type.$equal
          : runtimeType.equal.bind(runtimeType),
      },
      name: { enumerable: true, value: normalized.name },
      options: { value: normalized },
      primaryKey: { enumerable: true, value: Boolean(normalized.primaryKey) },
      type: { enumerable: true, value: type },
      validators: { enumerable: true, value: validators },
    });
  }

  get defaultValue(): FieldDefinitionValue<Definition> | undefined {
    return this.default;
  }

  get needQuotes(): boolean {
    return Boolean(this.type.needQuotes);
  }

  parse(value: unknown): FieldDefinitionValue<Definition> {
    return this.type.parse(value as never) as FieldDefinitionValue<Definition>;
  }

  restore(
    value: FieldDefinitionValue<Definition>,
  ): FieldDefinitionStorageValue<Definition> {
    return this.type.restore(value as never) as FieldDefinitionStorageValue<Definition>;
  }

  equal(
    left: FieldDefinitionValue<Definition>,
    right: FieldDefinitionValue<Definition>,
  ): boolean {
    const type = this.type as FieldTypeLike;
    if (type.equal === undefined) {
      return left === right;
    }

    return type.equal(left as never, right as never);
  }

  toJSON(
    value: FieldDefinitionValue<Definition>,
  ): FieldDefinitionJsonValue<Definition> {
    const type = this.type as FieldTypeLike;
    if (type.toJSON === undefined) {
      return value as FieldDefinitionJsonValue<Definition>;
    }

    return type.toJSON(value as never) as FieldDefinitionJsonValue<Definition>;
  }
}

export function cloneValue<Value>(value: Value): Value {
  return cloneDeep(value);
}

function normalizeValidators<Value>(
  validators:
    | FieldValidator<Value>
    | readonly FieldValidator<Value>[]
    | undefined,
): readonly FieldValidator<Value>[] {
  if (validators === undefined) {
    return [];
  }

  if (typeof validators === 'function') return [validators];
  return Array.isArray(validators)
    ? validators as readonly FieldValidator<Value>[]
    : [];
}

function resolveDefaultValue<Definition extends FieldDefinitionShape>(
  definition: Definition,
  type: FieldTypeFromDefinition<Definition>,
): FieldDefinitionValue<Definition> | undefined {
  if (definition.defaultValue !== undefined) {
    return definition.defaultValue as FieldDefinitionValue<Definition>;
  }

  return type.defaultValue as FieldDefinitionValue<Definition> | undefined;
}

function isRuntimeFieldType(type: FieldTypeLike | undefined): type is FieldTypeLike {
  return type !== undefined
    && typeof type.parse === 'function'
    && typeof type.restore === 'function';
}

function normalizeDefinition<Definition extends FieldDefinitionShape>(
  definition: Definition,
): FieldDefinitionShape {
  return otrans.toCamel(
    definition as Readonly<Record<string, unknown>>,
  ) as unknown as FieldDefinitionShape;
}
