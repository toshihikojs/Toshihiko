import type { FieldName } from './contracts/common';
import type {
  Field,
  FieldValidator,
  RowFromSchema,
  SchemaDefinition,
} from './contracts/field';
import type {
  BuildInput,
  BuiltRowFromSchema,
  Model,
} from './contracts/model';

export type YukariSource = 'delete' | 'new' | 'query';

export type BuiltYukari<
  Name extends string,
  Schema extends SchemaDefinition,
  Input extends BuildInput<Schema>,
> = Yukari<Name, Schema> & BuiltRowFromSchema<Schema, Input>;

export class Yukari<
  Name extends string,
  Schema extends SchemaDefinition,
> {
  declare readonly $model: Model<Name, Schema>;
  declare readonly $schema: Model<Name, Schema>['schema'];
  declare readonly $source: YukariSource;

  constructor(model: Model<Name, Schema>, source: YukariSource) {
    Object.defineProperties(this, {
      $model: { value: model },
      $schema: { value: model.schema },
      $source: { value: source, writable: true },
    });
  }

  buildNewRow(fields: BuildInput<Schema>): void {
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
