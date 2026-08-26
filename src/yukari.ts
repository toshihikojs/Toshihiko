import type { FieldName } from './contracts/common';
import type {
  Field,
  FieldDefinitionValue,
  FieldValidator,
  JsonRowFromSchema,
  RowFromSchema,
  SchemaDefinition,
} from './contracts/field';
import type {
  BuildInput,
  BuiltRowFromSchema,
  Model,
} from './contracts/model';

export type YukariSource = 'delete' | 'new' | 'query';

export type YukariOriginalData<Schema extends SchemaDefinition> = Partial<{
  [Definition in Schema[number] as Definition['name']]: {
    readonly fieldIdx: number;
    data: FieldDefinitionValue<Definition>;
  };
}>;

export interface YukariFieldData<Definition extends SchemaDefinition[number]> {
  readonly field: Field<Definition>;
  readonly value: FieldDefinitionValue<Definition>;
}

interface RuntimeField {
  readonly column: string;
  readonly name: string;
  equal(left: unknown, right: unknown): boolean;
  parse(value: unknown): unknown;
  toJSON(value: unknown): unknown;
}

interface RuntimeOriginalEntry {
  readonly fieldIdx: number;
  data: unknown;
}

type RuntimeOriginalData = Record<string, RuntimeOriginalEntry | undefined>;

export type BuiltYukari<
  Name extends string,
  Schema extends SchemaDefinition,
  Input extends BuildInput<Schema>,
> = Yukari<Name, Schema> & BuiltRowFromSchema<Schema, Input>;

export type QueriedYukari<
  Name extends string,
  Schema extends SchemaDefinition,
> = Yukari<Name, Schema> & Partial<RowFromSchema<Schema>>;

export class Yukari<
  Name extends string,
  Schema extends SchemaDefinition,
> {
  declare readonly $model: Model<Name, Schema>;
  declare readonly $schema: Model<Name, Schema>['schema'];
  declare readonly $source: YukariSource;
  declare $origData: YukariOriginalData<Schema>;

  constructor(model: Model<Name, Schema>, source: YukariSource) {
    Object.defineProperties(this, {
      $model: { value: model },
      $schema: { value: model.schema },
      $source: { value: source, writable: true },
      $origData: { value: {}, writable: true },
    });
  }

  buildNewRow(fields: BuildInput<Schema>): void {
    this.$origData = {};
    const input = fields as Readonly<Record<string, unknown>>;

    for (const field of this.$schema) {
      const suppliedValue = input[field.name];
      const value = suppliedValue === undefined
        ? field.defaultValue
        : suppliedValue;

      if (value === undefined) {
        continue;
      }

      Object.defineProperty(this, field.name, {
        configurable: false,
        enumerable: true,
        value: cloneValue(value),
        writable: true,
      });
    }
  }

  fillRowFromSource(
    row: Readonly<Record<string, unknown>>,
    rowInOriginalName = false,
  ): void {
    const originalData: Record<string, {
      readonly fieldIdx: number;
      data: FieldDefinitionValue<Schema[number]>;
    }> = {};

    for (const [fieldIdx, field] of this.$schema.entries()) {
      const runtimeField = field as unknown as RuntimeField;
      const sourceName = rowInOriginalName ? runtimeField.column : runtimeField.name;
      const sourceValue = row[sourceName];
      if (sourceValue === undefined) {
        continue;
      }

      const parsed = runtimeField.parse(sourceValue) as FieldDefinitionValue<Schema[number]>;
      originalData[runtimeField.name] = {
        fieldIdx,
        data: parsed,
      };

      Object.defineProperty(this, runtimeField.name, {
        configurable: false,
        enumerable: true,
        value: cloneValue(parsed),
        writable: true,
      });
    }

    this.$origData = originalData as YukariOriginalData<Schema>;
  }

  fieldIndex(name: string): number {
    if (this.$source !== 'new') {
      const originalData = this.$origData as unknown as RuntimeOriginalData;
      return originalData[name]?.fieldIdx ?? -1;
    }

    return this.$schema.findIndex((field) => field.name === name);
  }

  async validateOne<Field extends FieldName<RowFromSchema<Schema>>>(
    name: Field,
    value: RowFromSchema<Schema>[Field],
  ): Promise<void> {
    await this.validateField(name, value);
  }

  async validateAll(): Promise<void> {
    const values = this as Readonly<Record<string, unknown>>;

    for (const field of this.$schema) {
      if (!Object.prototype.hasOwnProperty.call(this, field.name)) {
        continue;
      }

      await this.validateField(field.name, values[field.name]);
    }
  }

  changes(): readonly YukariFieldData<Schema[number]>[] {
    const values = this as Readonly<Record<string, unknown>>;
    const changes: YukariFieldData<Schema[number]>[] = [];
    const originalData = this.$origData as unknown as RuntimeOriginalData;

    for (const field of this.$schema) {
      const runtimeField = field as unknown as RuntimeField;
      if (!Object.prototype.hasOwnProperty.call(this, runtimeField.name)) {
        continue;
      }

      const current = values[runtimeField.name] as FieldDefinitionValue<Schema[number]>;
      const original = originalData[runtimeField.name];
      if (original === undefined || !runtimeField.equal(current, original.data)) {
        changes.push({ field, value: current });
      }
    }

    return changes;
  }

  toJSON(useOriginalData = false): Partial<JsonRowFromSchema<Schema>> {
    const result: Record<string, unknown> = {};
    const values = this as Readonly<Record<string, unknown>>;
    const originalData = this.$origData as unknown as RuntimeOriginalData;

    for (const field of this.$schema) {
      const runtimeField = field as unknown as RuntimeField;
      const original = originalData[runtimeField.name];
      if (useOriginalData) {
        if (original === undefined) {
          continue;
        }
        result[runtimeField.name] = runtimeField.toJSON(original.data);
        continue;
      }

      if (!Object.prototype.hasOwnProperty.call(this, runtimeField.name)) {
        continue;
      }
      result[runtimeField.name] = runtimeField.toJSON(values[runtimeField.name]);
    }

    return result as Partial<JsonRowFromSchema<Schema>>;
  }

  static extractAdapterData<
    Name extends string,
    Schema extends SchemaDefinition,
  >(
    model: Model<Name, Schema>,
    data: Partial<RowFromSchema<Schema>>,
  ): readonly YukariFieldData<Schema[number]>[] {
    const values = data as Readonly<Record<string, unknown>>;
    const extracted: YukariFieldData<Schema[number]>[] = [];

    for (const field of model.schema) {
      if (!Object.prototype.hasOwnProperty.call(data, field.name)) {
        continue;
      }
      extracted.push({
        field,
        value: values[field.name] as FieldDefinitionValue<Schema[number]>,
      });
    }

    return extracted;
  }

  private async validateField(name: string, value: unknown): Promise<void> {
    const fieldNamesMap = this.$model.fieldNamesMap as unknown as Readonly<
      Record<string, Field<Schema[number]> | undefined>
    >;
    const field = fieldNamesMap[name];
    if (field === undefined) {
      throw new Error(`No such field ${name}.`);
    }

    if (value === null) {
      if (!field.allowNull) {
        throw new Error(`Field ${name} can't be null.`);
      }
      return;
    }

    for (const validator of field.validators) {
      const result = callValidator(validator, this.$model, value);
      if (!isPromiseLike(result)) {
        throw new TypeError(`Validator for field ${name} must return a Promise.`);
      }

      const message = await result;
      if (typeof message === 'string' && message.length > 0) {
        throw new Error(message);
      }
    }
  }
}

function callValidator<Value>(
  validator: FieldValidator<Value>,
  model: object,
  value: unknown,
): unknown {
  const callable = validator as unknown as (
    this: object,
    input: unknown,
  ) => unknown;
  return callable.call(model, value);
}

function isPromiseLike(
  value: unknown,
): value is PromiseLike<string | void> {
  return typeof value === 'object'
    && value !== null
    && 'then' in value
    && typeof value.then === 'function';
}

function cloneValue<Value>(value: Value): Value {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  return structuredClone(value);
}
