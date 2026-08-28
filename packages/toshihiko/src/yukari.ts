import type { FieldName } from './contracts/common';
import type {
  Adapter,
  AdapterConnection,
  AdapterData,
  AdapterDeleteQueryType,
  AdapterField,
  AdapterLike,
  AdapterModel,
  AdapterRow,
  AdapterValue,
} from './contracts/adapter';
import type {
  Field,
  FieldDefinitionValue,
  FieldValidator,
  JsonRowFromSchema,
  RowFromSchema,
  SchemaDefinition,
} from './contracts/field';
import { cloneValue } from './contracts/field';
import type {
  BuildInput,
  BuiltRowFromSchema,
  Model,
} from './contracts/model';
import type { QueryWhere } from './query';

export type YukariSource = 'delete' | 'new' | 'query';

export type YukariOriginalData<Schema extends SchemaDefinition> = Partial<{
  [Definition in Schema[number] as Definition['name']]: {
    readonly fieldIdx: number;
    data: FieldDefinitionValue<Definition>;
  };
}>;

export type YukariFieldData<Definition extends SchemaDefinition[number]> =
  Definition extends SchemaDefinition[number]
    ? {
        readonly field: Field<Definition>;
        readonly value: FieldDefinitionValue<Definition>;
      }
    : never;

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
  AdapterInstance extends AdapterLike = Adapter,
> = Yukari<Name, Schema, AdapterInstance>
  & Omit<BuiltRowFromSchema<Schema, Input>, keyof Yukari<Name, Schema, AdapterInstance>>;

export type QueriedYukari<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike = Adapter,
> = Yukari<Name, Schema, AdapterInstance>
  & Omit<Partial<RowFromSchema<Schema>>, keyof Yukari<Name, Schema, AdapterInstance>>;

export class Yukari<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike = Adapter,
> {
  declare readonly $model: Model<Name, Schema, AdapterInstance>;
  declare readonly $toshihiko: Model<Name, Schema, AdapterInstance>['parent'];
  declare readonly $schema: Model<Name, Schema, AdapterInstance>['schema'];
  declare readonly $source: YukariSource;
  declare $origData: YukariOriginalData<Schema>;
  declare readonly $dbName: string;
  declare readonly $tableName: string;
  declare readonly $cache: Model<Name, Schema, AdapterInstance>['cache'];
  declare $fromCache: boolean;
  declare readonly $adapter: AdapterInstance;

  constructor(model: Model<Name, Schema, AdapterInstance>, source: YukariSource) {
    Object.defineProperties(this, {
      $model: { value: model },
      $toshihiko: { value: model.parent },
      $schema: { value: model.schema },
      $source: { value: source, writable: true },
      $origData: { value: {}, writable: true },
      $dbName: { value: model.parent.database },
      $tableName: { value: model.name },
      $cache: { value: model.cache },
      $fromCache: { value: false, writable: true },
      $adapter: { value: model.parent.adapter },
      _initRow: { value: undefined },
      _buildRow: { value: this.buildNewRow },
      _fieldAt: { value: this.fieldIndex },
    });
  }

  buildNewRow(fields: BuildInput<Schema>, rowInOriginalName = false): void {
    this.$origData = {};
    const input = fields as Readonly<Record<string, unknown>>;

    for (const field of this.$schema) {
      const runtimeField = field as unknown as RuntimeField;
      const suppliedValue = input[rowInOriginalName ? field.column : field.name];
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
    if (input.$fromCache) {
      Reflect.set(this, '$fromCache', true);
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
    this.$origData = originalData as YukariOriginalData<Schema>;

    for (const [fieldIdx, field] of this.$schema.entries()) {
      const runtimeField = field as unknown as RuntimeField;
      const sourceName = rowInOriginalName ? runtimeField.column : runtimeField.name;
      const sourceValue = row[sourceName];
      if (sourceValue === undefined) {
        continue;
      }

      const parsed = (sourceValue === null
        ? null
        : runtimeField.parse(sourceValue)) as FieldDefinitionValue<Schema[number]>;
      originalData[runtimeField.name] = {
        fieldIdx,
        data: parsed,
      };
    }

    for (const [name, entry] of Object.entries(originalData)) {
      if (entry === undefined) continue;
      Object.defineProperty(this, name, {
        configurable: false,
        enumerable: true,
        value: cloneValue(entry.data),
        writable: true,
      });
    }

    if (row.$fromCache) {
      Reflect.set(this, '$fromCache', true);
    }
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
    const names = Object.keys(this).filter((name) => (
      !name.startsWith('$')
      && typeof values[name] !== 'function'
      && this.fieldIndex(name) !== -1
    ));
    let index = 0;
    const workers = Array.from(
      { length: Math.min(10, names.length) },
      async () => {
        while (index < names.length) {
          const name = names[index++]!;
          await this.validateField(name, values[name]);
        }
      },
    );
    await Promise.all(workers);
  }

  async insert(
    connection: AdapterConnection<AdapterInstance> | null = null,
  ): Promise<this> {
    if (this.$source !== 'new') {
      throw new Error('You must call this function via a new Yukari object.');
    }
    await this.validateAll();

    const adapter = this.$adapter as unknown as Adapter<
      AdapterModel<AdapterInstance>,
      AdapterConnection<AdapterInstance>,
      AdapterField<AdapterInstance>,
      AdapterValue<AdapterInstance>
    >;
    const data = Yukari.extractAdapterData(
      this.$model,
      this as unknown as Partial<RowFromSchema<Schema>>,
    );
    const row = await adapter.insert(
      this.$model as unknown as AdapterModel<AdapterInstance>,
      connection,
      data as unknown as readonly AdapterData<
        AdapterField<AdapterInstance>,
        AdapterValue<AdapterInstance>
      >[],
    );
    if (row !== null && row !== undefined) {
      for (const key of Object.keys(row)) {
        const value = (row as Readonly<Record<string, unknown>>)[key];
        if ((key.startsWith('$') && key !== '$origData') || typeof value === 'function') {
          continue;
        }
        Reflect.set(this, key, key === '$origData' ? value : cloneValue(value));
      }
    }
    return this;
  }

  async update(
    connection: AdapterConnection<AdapterInstance> | null = null,
  ): Promise<this> {
    if (this.$source === 'new') {
      throw new Error('You must call this function via an old Yukari object.');
    }

    let data = this.updateChanges();
    if (data.length === 0) {
      data = Yukari.extractAdapterData(
        this.$model,
        this as unknown as Partial<RowFromSchema<Schema>>,
      );
    }
    const primaryKey = this.originalLocator();
    await this.validateAll();

    const adapter = this.$adapter as unknown as Adapter<
      AdapterModel<AdapterInstance>,
      AdapterConnection<AdapterInstance>,
      AdapterField<AdapterInstance>,
      AdapterValue<AdapterInstance>
    >;
    await adapter.update(
      this.$model as unknown as AdapterModel<AdapterInstance>,
      connection,
      primaryKey,
      data as unknown as readonly AdapterData<
        AdapterField<AdapterInstance>,
        AdapterValue<AdapterInstance>
      >[],
    );
    const originalData = this.$origData as unknown as RuntimeOriginalData;
    for (const entry of data) {
      const field = entry.field as Field<Schema[number]>;
      originalData[field.name]!.data = entry.value;
    }
    Reflect.set(this, '$source', 'query');
    return this;
  }

  async delete(
    connection: AdapterConnection<AdapterInstance> | null = null,
  ): Promise<true> {
    if (this.$source === 'new') {
      throw new Error("You can't call this function via a new Yukari object.");
    }

    const primaryKey = this.originalLocator();
    const query = this.$model
      .where(primaryKey as QueryWhere<RowFromSchema<Schema>>)
      .limit(0, 1);
    query.conn(connection);

    const adapter = this.$adapter as unknown as {
      readonly deleteByQuery: (
        query: AdapterDeleteQueryType<AdapterInstance>,
      ) => Promise<unknown>;
    };
    const result = await adapter.deleteByQuery(
      query as unknown as AdapterDeleteQueryType<AdapterInstance>,
    );
    if (!result) {
      throw new Error('unknown error.');
    }
    Reflect.set(this, '$source', 'delete');
    return true;
  }

  async save(
    connection: AdapterConnection<AdapterInstance> | null = null,
  ): Promise<this> {
    if (this.$source === 'new') {
      return this.insert(connection);
    }
    return this.update(connection);
  }

  toJSON(useOriginalData = false): Partial<JsonRowFromSchema<Schema>> {
    const result: Record<string, unknown> = {};
    const values = this as Readonly<Record<string, unknown>>;
    const originalData = this.$origData as unknown as RuntimeOriginalData;

    const names = useOriginalData ? Object.keys(originalData) : Object.keys(this);
    for (const name of names) {
      const value = useOriginalData ? originalData[name]?.data : values[name];
      if (!useOriginalData && (name.startsWith('$') || typeof value === 'function')) continue;
      const fieldIdx = useOriginalData ? originalData[name]?.fieldIdx ?? -1 : this.fieldIndex(name);
      const field = this.$schema[fieldIdx] as unknown as RuntimeField | undefined;
      result[name] = field === undefined ? value : field.toJSON(value);
    }

    return result as Partial<JsonRowFromSchema<Schema>>;
  }

  static extractAdapterData<
    Name extends string,
    Schema extends SchemaDefinition,
    AdapterInstance extends AdapterLike,
  >(
    model: Model<Name, Schema, AdapterInstance>,
    data: Partial<RowFromSchema<Schema>>,
  ): readonly YukariFieldData<Schema[number]>[] {
    const values = data as Readonly<Record<string, unknown>>;
    const extracted: YukariFieldData<Schema[number]>[] = [];

    for (const name of Object.keys(data)) {
      if (name.startsWith('$')) continue;
      const fields = model.fieldNamesMap as unknown as Readonly<Record<string, Field<Schema[number]> | undefined>>;
      const field = fields[name];
      if (field === undefined) continue;
      extracted.push({
        field,
        value: values[name] as FieldDefinitionValue<Schema[number]>,
      } as YukariFieldData<Schema[number]>);
    }

    return extracted;
  }

  private originalLocator(): Readonly<Record<string, unknown>> {
    const originalData = this.$origData as unknown as RuntimeOriginalData;
    const primaryKey: Record<string, unknown> = {};
    if (this.$model.primaryKeys.length > 0) {
      for (const field of this.$model.primaryKeys) {
        const original = originalData[field.name];
        if (original !== undefined) primaryKey[field.name] = original.data;
      }
      return primaryKey;
    }
    for (const [name, original] of Object.entries(originalData)) {
      if (original !== undefined) primaryKey[name] = original.data;
    }
    return primaryKey;
  }

  private updateChanges(): readonly YukariFieldData<Schema[number]>[] {
    const values = this as Readonly<Record<string, unknown>>;
    const originalData = this.$origData as unknown as RuntimeOriginalData;
    const changes: YukariFieldData<Schema[number]>[] = [];
    for (const name of Object.keys(this)) {
      if (name.startsWith('$') || typeof values[name] === 'function') continue;
      const fields = this.$model.fieldNamesMap as unknown as Readonly<Record<string, Field<Schema[number]> | undefined>>;
      const field = fields[name];
      if (field === undefined) continue;
      const original = originalData[name];
      // v1 reads the original snapshot directly and lets JavaScript surface a
      // native TypeError when a queried row contains a field absent from it.
      const originalValue = original!.data;
      const current = values[name] as FieldDefinitionValue<Schema[number]>;
      if ((current === null || originalValue === null)
        && current !== originalValue
        && field.allowNull) {
        changes.push({ field, value: current } as YukariFieldData<Schema[number]>);
      } else if (!field.equal(current, originalValue as FieldDefinitionValue<Schema[number]>)) {
        changes.push({ field, value: current } as YukariFieldData<Schema[number]>);
      }
    }
    return changes;
  }

  private async validateField(name: string, value: unknown): Promise<void> {
    const fieldIndex = this.fieldIndex(name);
    const field = fieldIndex === -1 ? undefined : this.$schema[fieldIndex];
    if (field === undefined) {
      throw new Error(`No such field ${name}`);
    }

    if (value === null) {
      if (!field.allowNull) {
        throw new Error(`Field ${name} can't be null.`);
      }
      return;
    }

    for (const validator of field.validators) {
      const message = await callValidator(validator, this.$model, value);
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
): ReturnType<FieldValidator<Value>> {
  const callable = validator as unknown as (
    this: object,
    input: unknown,
  ) => ReturnType<FieldValidator<Value>>;
  return callable.call(model, value);
}
