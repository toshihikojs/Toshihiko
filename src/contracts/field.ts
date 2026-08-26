import { Type } from '../field-types';

export interface FieldType<
  Value,
  StorageValue = unknown,
  JsonValue = Value,
> {
  readonly name: string;
  readonly defaultValue?: Value;
  parse(value: StorageValue): Value;
  restore(value: Value): StorageValue;
  equal?(left: Value, right: Value): boolean;
  toJSON?(value: Value): JsonValue;
}

export interface FieldTypeLike {
  readonly name: string;
  readonly defaultValue?: unknown;
  parse(value: never): unknown;
  restore(value: never): unknown;
  equal?(left: never, right: never): boolean;
  toJSON?(value: never): unknown;
}

export type FieldTypeValue<Type extends FieldTypeLike> = ReturnType<Type['parse']>;

export type FieldValidator<Value> = (
  value: Value,
) => Promise<string | void>;

type AsyncValidatorShape = (...arguments_: never[]) => Promise<unknown>;

export interface FieldDefinitionShape {
  readonly name: string;
  readonly column?: string;
  readonly type?: FieldTypeLike;
  readonly validators?: AsyncValidatorShape | readonly AsyncValidatorShape[];
  readonly allowNull?: boolean;
  readonly primaryKey?: boolean;
  readonly autoIncrement?: boolean;
  readonly default?: unknown;
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
  readonly default?: FieldTypeValue<FieldTypeDefinition>;
  readonly defaultValue?: FieldTypeValue<FieldTypeDefinition>;
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

export type FieldDefinitionJsonValue<Definition extends FieldDefinitionShape> =
  null extends FieldDefinitionValue<Definition>
    ? FieldTypeJsonValue<FieldTypeFromDefinition<Definition>> | null
    : FieldTypeJsonValue<FieldTypeFromDefinition<Definition>>;

type FieldTypeJsonValue<Type extends FieldTypeLike> =
  Type extends { toJSON(value: never): infer JsonValue }
    ? JsonValue
    : FieldTypeValue<Type>;

export type JsonRowFromSchema<Schema extends SchemaDefinition> = {
  [Definition in Schema[number] as Definition['name']]:
    FieldDefinitionJsonValue<Definition>;
};

export type ValidatedFieldDefinition<Definition extends FieldDefinitionShape> = Omit<
  Definition,
  'default' | 'defaultValue' | 'validators'
> & {
  readonly default?: FieldDefinitionValue<Definition>;
  readonly defaultValue?: FieldDefinitionValue<Definition>;
  readonly validators?:
    | FieldValidator<FieldDefinitionValue<Definition>>
    | readonly FieldValidator<FieldDefinitionValue<Definition>>[];
};

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
  readonly name: Definition['name'];
  readonly column: string;
  readonly type: FieldTypeFromDefinition<Definition>;
  readonly validators: readonly FieldValidator<FieldDefinitionValue<Definition>>[];
  readonly allowNull: boolean;
  readonly primaryKey: boolean;
  readonly autoIncrement: boolean;
  readonly defaultValue: FieldDefinitionValue<Definition> | undefined;

  constructor(definition: Definition & ValidatedFieldDefinition<Definition>) {
    if (!definition.name) {
      throw new Error('no field name specified.');
    }

    this.name = definition.name;
    this.column = definition.column ?? definition.name;
    this.type = (definition.type ?? Type.String) as FieldTypeFromDefinition<Definition>;
    this.validators = normalizeValidators<FieldDefinitionValue<Definition>>(
      definition.validators as
        | FieldValidator<FieldDefinitionValue<Definition>>
        | readonly FieldValidator<FieldDefinitionValue<Definition>>[]
        | undefined,
    );
    this.allowNull = definition.allowNull ?? false;
    this.primaryKey = definition.primaryKey ?? false;
    this.autoIncrement = definition.autoIncrement ?? false;
    this.defaultValue = resolveDefaultValue(definition, this.type);
  }

  parse(value: unknown): FieldDefinitionValue<Definition> {
    if (value === null) {
      return null as FieldDefinitionValue<Definition>;
    }

    return this.type.parse(value as never) as FieldDefinitionValue<Definition>;
  }

  restore(value: FieldDefinitionValue<Definition>): unknown {
    if (value === null) {
      return null;
    }

    return this.type.restore(value as never);
  }

  equal(
    left: FieldDefinitionValue<Definition>,
    right: FieldDefinitionValue<Definition>,
  ): boolean {
    if (left === null || right === null) {
      return left === right;
    }

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
    if (value === null || type.toJSON === undefined) {
      return value as FieldDefinitionJsonValue<Definition>;
    }

    return type.toJSON(value as never) as FieldDefinitionJsonValue<Definition>;
  }
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

  if (typeof validators !== 'function' && !Array.isArray(validators)) {
    throw new TypeError('field validators must be functions that return Promises.');
  }

  const normalized = typeof validators === 'function' ? [validators] : validators;
  for (const validator of normalized) {
    if (typeof validator !== 'function') {
      throw new TypeError('field validators must be functions that return Promises.');
    }
    if (validator.length > 1) {
      throw new TypeError('callback validators are not supported in Toshihiko v2.');
    }
  }

  return normalized;
}

function resolveDefaultValue<Definition extends FieldDefinitionShape>(
  definition: Definition,
  type: FieldTypeFromDefinition<Definition>,
): FieldDefinitionValue<Definition> | undefined {
  if (Object.prototype.hasOwnProperty.call(definition, 'defaultValue')) {
    return definition.defaultValue as FieldDefinitionValue<Definition>;
  }

  if (Object.prototype.hasOwnProperty.call(definition, 'default')) {
    return definition.default as FieldDefinitionValue<Definition>;
  }

  return type.defaultValue as FieldDefinitionValue<Definition> | undefined;
}
