import { Type } from '../field-types';
import type { DataValue } from './common';

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

/**
 * Defines conversion between storage, application, and JSON values.
 *
 * @category Schema and fields
 */
export type FieldType<
  Value,
  StorageValue = Value,
  JsonValue = Value,
> = {
  readonly [fieldTypeValue]?: Value;
  readonly [fieldTypeStorageValue]?: StorageValue;
  readonly [fieldTypeJsonValue]?: JsonValue;
  /** Human-readable Field Type name. */
  readonly name?: string;
  /** Whether SQL adapters should quote restored values. */
  readonly needQuotes?: boolean;
  /** Default application value used when a field omits `defaultValue`. */
  readonly defaultValue?: Value;
  /** Converts a storage value into its application representation. */
  parse(value: StorageValue): Value;
  /** Converts an application value into its storage representation. */
  restore(value: Value): StorageValue;
  /** Compares two application values for change detection. */
  equal?(left: Value, right: Value): boolean;
} & FieldTypeJsonMethod<Value, JsonValue>;

export interface FieldTypeLike {
  readonly [fieldTypeValue]?: DataValue;
  readonly [fieldTypeStorageValue]?: DataValue;
  readonly [fieldTypeJsonValue]?: DataValue;
  readonly name?: string;
  readonly needQuotes?: boolean;
  readonly defaultValue?: DataValue;
  parse(value: never): DataValue;
  restore(value: never): DataValue;
  equal?(left: never, right: never): boolean;
  toJSON?(value: never): DataValue;
}

export type FieldTypeValue<Type extends FieldTypeLike> =
  typeof fieldTypeValue extends keyof Type
    ? Exclude<Type[typeof fieldTypeValue], undefined>
    : ReturnType<Type['parse']>;

/** Resolves the storage value returned by a Field Type's `restore()` method. */
export type FieldTypeStorageValue<Type extends FieldTypeLike> =
  ReturnType<Type['restore']>;

/**
 * A validator executed before a Yukari row is written.
 *
 * @category Schema and fields
 */
export type FieldValidator<Value> = (
  value: Value,
) => string | void | Promise<string | void>;

/**
 * The common shape accepted for one entry in a Toshihiko schema.
 *
 * Use {@link FieldDefinition} when a reusable declaration should retain its
 * literal field name and concrete Field Type. This broader interface is the
 * structural constraint used by {@link SchemaDefinition}.
 *
 * @category Schema and fields
 */
export interface SchemaFieldDefinition {
  /** Logical property name exposed on Yukari rows. */
  readonly name: string;
  /** Storage column name; defaults to {@link name}. */
  readonly column?: string;
  /** Value conversion contract; defaults to `Type.String`. */
  readonly type?: FieldTypeLike;
  /** One validator or a list executed before writes. */
  readonly validators?:
    | FieldValidator<never>
    | readonly FieldValidator<never>[];
  /** Whether the application value may be `null`. */
  readonly allowNull?: boolean;
  /** Whether the field participates in primary-key lookups and row locators. */
  readonly primaryKey?: boolean;
  /** Whether the storage backend generates this field on insert. */
  readonly autoIncrement?: boolean;
  /** Application value used when a newly built row omits this field. */
  readonly defaultValue?: DataValue;
}

/**
 * A schema entry which retains its field name and Field Type.
 *
 * @category Schema and fields
 */
export interface FieldDefinition<
  Name extends string = string,
  FieldTypeDefinition extends FieldTypeLike = FieldTypeLike,
> extends SchemaFieldDefinition {
  /** Literal logical property name retained for schema inference. */
  readonly name: Name;
  /** Storage column name; defaults to {@link name}. */
  readonly column?: string;
  /** Concrete Field Type retained for value inference. */
  readonly type?: FieldTypeDefinition;
  /** Validators receiving the inferred application value. */
  readonly validators?:
    | FieldValidator<FieldTypeValue<FieldTypeDefinition>>
    | readonly FieldValidator<FieldTypeValue<FieldTypeDefinition>>[];
  /** Whether the inferred application value includes `null`. */
  readonly allowNull?: boolean;
  /** Whether the field participates in primary-key lookup. */
  readonly primaryKey?: boolean;
  /** Whether the storage backend generates this field on insert. */
  readonly autoIncrement?: boolean;
  /** Application value used when a newly built row omits this field. */
  readonly defaultValue?: FieldTypeValue<FieldTypeDefinition> | undefined;
}

/**
 * A readonly list of field definitions accepted by {@link Toshihiko.define}.
 *
 * An ordinary array literal passed directly to `define()` retains each field's
 * literal name and Field Type.
 *
 * @example
 * ```ts
 * const User = database.define('user', [
 *   { name: 'id', type: Type.Integer, primaryKey: true },
 *   { name: 'email', type: Type.String },
 * ]);
 * ```
 *
 * @category Schema and fields
 */
export type SchemaDefinition = readonly SchemaFieldDefinition[];

/** Resolves the concrete Field Type used by one schema entry. */
export type FieldTypeFromDefinition<Definition extends SchemaFieldDefinition> =
  Definition extends { readonly type: infer FieldTypeDefinition extends FieldTypeLike }
    ? FieldTypeDefinition
    : typeof Type.String;

type NullableValue<Definition extends SchemaFieldDefinition> =
  Definition extends { readonly allowNull: true } ? null : never;

/** Resolves one schema entry's application value, including nullable fields. */
export type FieldDefinitionValue<Definition extends SchemaFieldDefinition> =
  | FieldTypeValue<FieldTypeFromDefinition<Definition>>
  | NullableValue<Definition>;

/** Resolves one schema entry's non-null application value. */
export type FieldDefinitionNonNullValue<Definition extends SchemaFieldDefinition> =
  FieldTypeValue<FieldTypeFromDefinition<Definition>>;

/** Resolves the storage value produced by one schema entry's Field Type. */
export type FieldDefinitionStorageValue<Definition extends SchemaFieldDefinition> =
  FieldTypeStorageValue<FieldTypeFromDefinition<Definition>>;

/** Resolves the JSON value produced by one schema entry's Field Type. */
export type FieldDefinitionJsonValue<Definition extends SchemaFieldDefinition> =
  null extends FieldDefinitionValue<Definition>
    ? FieldTypeJsonValue<FieldTypeFromDefinition<Definition>> | null
    : FieldTypeJsonValue<FieldTypeFromDefinition<Definition>>;

type FieldTypeJsonValue<Type extends FieldTypeLike> =
  typeof fieldTypeJsonValue extends keyof Type
    ? Exclude<Type[typeof fieldTypeJsonValue], undefined>
    : Type extends { toJSON(value: never): infer JsonValue }
      ? JsonValue
      : FieldTypeValue<Type>;

/** Maps a Schema to its serialized row object. */
export type JsonRowFromSchema<Schema extends SchemaDefinition> = {
  [Definition in Schema[number] as Definition['name']]:
    FieldDefinitionJsonValue<Definition>;
};

export type ValidatedFieldDefinition<Definition extends SchemaFieldDefinition> = Omit<
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
  Type extends { toJSON(value: infer Input): DataValue }
    ? SameType<Input, Value>
    : true;

/**
 * Verifies that a Field Type's conversion and comparison methods agree on the
 * same application and storage values. Invalid definitions resolve to `never`.
 */
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

/** Applies Field Type and validator consistency checks to every schema entry. */
export type ValidatedSchema<Schema extends SchemaDefinition> = {
  readonly [Index in keyof Schema]: Schema[Index] extends SchemaFieldDefinition
    ? ValidatedFieldDefinition<Schema[Index]>
    : never;
};

/** Maps a Schema to its application row object. */
export type RowFromSchema<Schema extends SchemaDefinition> = {
  [Definition in Schema[number] as Definition['name']]: FieldDefinitionValue<Definition>;
};

/** Extracts the logical names of fields marked with `primaryKey: true`. */
export type PrimaryKeyNames<Schema extends SchemaDefinition> = Extract<
  Schema[number],
  { readonly primaryKey: true }
>['name'];

/**
 * The runtime representation of one compiled schema entry.
 *
 * @category Schema and fields
 */
export class Field<
  Definition extends SchemaFieldDefinition = SchemaFieldDefinition,
> {
  /** Normalized field options. */
  declare readonly options: Readonly<Definition>;
  /** Logical property name exposed on Yukari rows. */
  declare readonly name: Definition['name'];
  /** Storage column name used by Adapters. */
  declare readonly column: string;
  /** Field Type used for parsing, restoring, comparison, and JSON conversion. */
  declare readonly type: FieldTypeFromDefinition<Definition>;
  /** Normalized validator list. */
  declare readonly validators: readonly FieldValidator<FieldDefinitionNonNullValue<Definition>>[];
  /** Whether the field accepts `null`. */
  declare readonly allowNull: boolean;
  /** Whether the field participates in row locators. */
  declare readonly primaryKey: boolean;
  /** Whether the storage backend generates this field. */
  declare readonly autoIncrement: boolean;
  /** Resolved schema or Field Type default. */
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

  /** Compatibility getter for {@link default}. */
  get defaultValue(): FieldDefinitionValue<Definition> | undefined {
    return this.default;
  }

  /** Whether SQL adapters should quote the restored value. */
  get needQuotes(): boolean {
    return Boolean(this.type.needQuotes);
  }

  /**
   * Converts a storage value into its application representation.
   *
   * @param value - Value returned by the storage backend.
   * @returns Parsed application value.
   */
  parse(
    value: FieldDefinitionStorageValue<Definition>,
  ): FieldDefinitionValue<Definition> {
    return this.type.parse(value as never) as FieldDefinitionValue<Definition>;
  }

  /**
   * Converts an application value into its storage representation.
   *
   * @param value - Current Yukari field value.
   * @returns Value ready for the Adapter.
   */
  restore(
    value: FieldDefinitionValue<Definition>,
  ): FieldDefinitionStorageValue<Definition> {
    return this.type.restore(value as never) as FieldDefinitionStorageValue<Definition>;
  }

  /** Compares two application values using the Field Type or strict equality. */
  declare readonly equal: (
    left: FieldDefinitionValue<Definition>,
    right: FieldDefinitionValue<Definition>,
  ) => boolean;

  /**
   * Converts an application value into its JSON representation.
   *
   * @param value - Application value to serialize.
   * @returns Field Type JSON value, or the input unchanged when no converter
   * is defined.
   */
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

function resolveDefaultValue<Definition extends SchemaFieldDefinition>(
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

function normalizeDefinition<Definition extends SchemaFieldDefinition>(
  definition: Definition,
): SchemaFieldDefinition {
  return otrans.toCamel(
    definition as Readonly<Record<string, unknown>>,
  ) as unknown as SchemaFieldDefinition;
}
