import { Type } from '../field-types';

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
  StorageValue = unknown,
  JsonValue = Value,
> = {
  readonly [fieldTypeValue]?: Value;
  readonly [fieldTypeStorageValue]?: StorageValue;
  readonly [fieldTypeJsonValue]?: JsonValue;
  readonly name: string;
  readonly needQuotes?: boolean;
  readonly defaultValue?: Value;
  parse(value: StorageValue): Value;
  restore(value: Value): StorageValue;
  clone?(value: Value): Value;
  equal?(left: Value, right: Value): boolean;
} & FieldTypeJsonMethod<Value, JsonValue>;

export interface FieldTypeLike {
  readonly [fieldTypeValue]?: unknown;
  readonly [fieldTypeStorageValue]?: unknown;
  readonly [fieldTypeJsonValue]?: unknown;
  readonly name: string;
  readonly needQuotes?: boolean;
  readonly defaultValue?: unknown;
  parse(value: never): unknown;
  restore(value: never): unknown;
  clone?(value: never): unknown;
  equal?(left: never, right: never): boolean;
  toJSON?(value: never): unknown;
}

export type FieldTypeValue<Type extends FieldTypeLike> =
  typeof fieldTypeValue extends keyof Type
    ? Exclude<Type[typeof fieldTypeValue], undefined>
    : ReturnType<Type['parse']>;

export type FieldValidator<Value> = (
  value: Value,
) => Promise<string | void>;

type FieldValidatorShape = {
  validate(value: any): Promise<string | void>;
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
  readonly default?: FieldTypeValue<FieldTypeDefinition> | undefined;
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
  'default' | 'defaultValue' | 'type' | 'validators'
> & {
  readonly type?: Definition extends {
    readonly type: infer FieldTypeDefinition extends FieldTypeLike;
  }
    ? ValidatedFieldType<FieldTypeDefinition>
    : FieldTypeLike;
  readonly default?: FieldDefinitionValue<Definition> | undefined;
  readonly defaultValue?: FieldDefinitionValue<Definition> | undefined;
  readonly validators?:
    | FieldValidator<FieldDefinitionNonNullValue<Definition>>
    | readonly FieldValidator<FieldDefinitionNonNullValue<Definition>>[];
};

type HasValidClone<Type extends FieldTypeLike, Value> =
  Type extends { clone(value: infer Input): infer Output }
    ? SameType<Input, Value> extends true
      ? SameType<Output, Value>
      : false
    : true;

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
        ? HasValidClone<Type, Value> extends true
          ? HasValidEqual<Type, Value> extends true
            ? HasValidToJSON<Type, Value> extends true ? Type : never
            : never
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
  readonly name: Definition['name'];
  readonly column: string;
  readonly type: FieldTypeFromDefinition<Definition>;
  readonly validators: readonly FieldValidator<FieldDefinitionNonNullValue<Definition>>[];
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
    this.validators = normalizeValidators<FieldDefinitionNonNullValue<Definition>>(
      definition.validators as
        | FieldValidator<FieldDefinitionNonNullValue<Definition>>
        | readonly FieldValidator<FieldDefinitionNonNullValue<Definition>>[]
        | undefined,
    );
    this.allowNull = definition.allowNull ?? false;
    this.primaryKey = definition.primaryKey ?? false;
    this.autoIncrement = definition.autoIncrement ?? false;
    this.defaultValue = resolveDefaultValue(definition, this.type);
  }

  parse(value: unknown): FieldDefinitionValue<Definition> {
    if (value === null) {
      if (!this.allowNull) {
        throw new TypeError(`Field ${this.name} can't be null.`);
      }
      return null as FieldDefinitionValue<Definition>;
    }

    return this.type.parse(value as never) as FieldDefinitionValue<Definition>;
  }

  clone(
    value: FieldDefinitionValue<Definition>,
  ): FieldDefinitionValue<Definition> {
    const type = this.type as FieldTypeLike;
    if (value === null) {
      return value;
    }

    return type.clone === undefined
      ? cloneValue(value)
      : type.clone(value as never) as FieldDefinitionValue<Definition>;
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
      return equalValues(left, right);
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

function cloneValue<Value>(value: Value, seen = new WeakMap<object, object>()): Value {
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  const existing = seen.get(value);
  if (existing !== undefined) {
    return existing as Value;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as Value;
  }
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as Value;
  }
  if (value instanceof ArrayBuffer) {
    return value.slice(0) as Value;
  }
  if (ArrayBuffer.isView(value)) {
    return structuredClone(value) as Value;
  }

  if (value instanceof Map) {
    const cloned = new Map();
    seen.set(value, cloned);
    for (const [key, entry] of value) {
      cloned.set(cloneValue(key, seen), cloneValue(entry, seen));
    }
    return cloned as Value;
  }
  if (value instanceof Set) {
    const cloned = new Set();
    seen.set(value, cloned);
    for (const entry of value) {
      cloned.add(cloneValue(entry, seen));
    }
    return cloned as Value;
  }

  const cloned = Array.isArray(value)
    ? new Array(value.length)
    : Object.create(Object.getPrototypeOf(value)) as object;
  seen.set(value, cloned);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined) {
      continue;
    }
    if ('value' in descriptor) {
      descriptor.value = cloneValue(descriptor.value, seen);
    }
    Object.defineProperty(cloned, key, descriptor);
  }
  return cloned as Value;
}

function equalValues(
  left: unknown,
  right: unknown,
  seen = new WeakMap<object, object>(),
): boolean {
  if (Object.is(left, right)) {
    return true;
  }
  if (typeof left !== 'object' || left === null
    || typeof right !== 'object' || right === null
    || Object.getPrototypeOf(left) !== Object.getPrototypeOf(right)) {
    return false;
  }

  const existing = seen.get(left);
  if (existing !== undefined) {
    return existing === right;
  }
  seen.set(left, right);

  if (left instanceof Date && right instanceof Date) {
    return left.getTime() === right.getTime();
  }
  if (left instanceof RegExp && right instanceof RegExp) {
    return left.source === right.source && left.flags === right.flags;
  }
  if (left instanceof ArrayBuffer && right instanceof ArrayBuffer) {
    return equalByteViews(new Uint8Array(left), new Uint8Array(right));
  }
  if (ArrayBuffer.isView(left) && ArrayBuffer.isView(right)) {
    return equalByteViews(
      new Uint8Array(left.buffer, left.byteOffset, left.byteLength),
      new Uint8Array(right.buffer, right.byteOffset, right.byteLength),
    );
  }
  if (left instanceof Map && right instanceof Map) {
    if (left.size !== right.size) {
      return false;
    }
    const rightEntries = [...right.entries()];
    return [...left.entries()].every(([leftKey, leftValue], index) => {
      const rightEntry = rightEntries[index];
      return rightEntry !== undefined
        && equalValues(leftKey, rightEntry[0], seen)
        && equalValues(leftValue, rightEntry[1], seen);
    });
  }
  if (left instanceof Set && right instanceof Set) {
    if (left.size !== right.size) {
      return false;
    }
    const rightEntries = [...right.values()];
    return [...left.values()].every((leftValue, index) => (
      equalValues(leftValue, rightEntries[index], seen)
    ));
  }

  const leftKeys = Reflect.ownKeys(left);
  const rightKeys = Reflect.ownKeys(right);
  if (leftKeys.length !== rightKeys.length
    || leftKeys.some((key) => !Object.prototype.hasOwnProperty.call(right, key))) {
    return false;
  }

  return leftKeys.every((key) => {
    const leftDescriptor = Object.getOwnPropertyDescriptor(left, key);
    const rightDescriptor = Object.getOwnPropertyDescriptor(right, key);
    if (leftDescriptor === undefined || rightDescriptor === undefined
      || leftDescriptor.enumerable !== rightDescriptor.enumerable
      || leftDescriptor.configurable !== rightDescriptor.configurable
      || ('writable' in leftDescriptor && 'writable' in rightDescriptor
        && leftDescriptor.writable !== rightDescriptor.writable)) {
      return false;
    }
    if ('value' in leftDescriptor && 'value' in rightDescriptor) {
      return equalValues(leftDescriptor.value, rightDescriptor.value, seen);
    }
    return leftDescriptor.get === rightDescriptor.get
      && leftDescriptor.set === rightDescriptor.set;
  });
}

function equalByteViews(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength
    && left.every((value, index) => value === right[index]);
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
