import type { FieldName } from './common';
import type {
  Adapter,
  AdapterConnection,
  AdapterLike,
} from './adapter';
import {
  isReservedYukariFieldName,
  Yukari,
  type BuiltYukari,
  type QueriedYukari,
} from '../yukari';
import {
  Query,
  type FindByIdInput,
  type QueryFindOptions,
  type QueryJsonRow,
  type QueryOrder,
  type QueryWhere,
} from '../query';
import {
  Field,
  type FieldDefinitionShape,
  type FieldTypeFromDefinition,
  type PrimaryKeyNames,
  type RowFromSchema,
  type SchemaDefinition,
  type ValidatedFieldDefinition,
} from './field';
import type { Toshihiko } from '../toshihiko';

export interface ModelOptions {
  readonly cache?: unknown;
  readonly [key: string]: unknown;
}

type ColumnName<Definition extends FieldDefinitionShape> =
  Definition extends { readonly column: infer Column extends string }
    ? Column
    : Definition['name'];

export type CompiledSchema<Schema extends SchemaDefinition> = {
  readonly [Index in keyof Schema]: Schema[Index] extends FieldDefinitionShape
    ? Field<Schema[Index]>
    : never;
};

export type NameToColumnMap<Schema extends SchemaDefinition> = {
  readonly [Definition in Schema[number] as Definition['name']]: ColumnName<Definition>;
};

export type FieldNamesMap<Schema extends SchemaDefinition> = {
  readonly [Definition in Schema[number] as Definition['name']]: Field<Definition>;
};

export type BuildInput<Schema extends SchemaDefinition> = Partial<RowFromSchema<Schema>>;

type DefaultedDefinition<Definition extends FieldDefinitionShape> =
  Definition extends { readonly default: infer Value }
    ? undefined extends Value ? never : Definition
    : Definition extends { readonly defaultValue: infer Value }
      ? undefined extends Value ? never : Definition
      : FieldTypeFromDefinition<Definition> extends { readonly defaultValue: infer Value }
        ? undefined extends Value ? never : Definition
        : never;

type DefaultedFieldNames<Schema extends SchemaDefinition> =
  DefaultedDefinition<Schema[number]>['name'];

type RequiredKeys<Input extends object> = {
  [Name in keyof Input]-?: {} extends Pick<Input, Name> ? never : Name;
}[keyof Input];

type KnownBuiltFieldNames<
  Schema extends SchemaDefinition,
  Input extends BuildInput<Schema>,
> = Extract<RequiredKeys<Input> | DefaultedFieldNames<Schema>, keyof RowFromSchema<Schema>>;

export type BuiltRowFromSchema<
  Schema extends SchemaDefinition,
  Input extends BuildInput<Schema>,
> = Pick<RowFromSchema<Schema>, KnownBuiltFieldNames<Schema, Input>>
  & Partial<Omit<RowFromSchema<Schema>, KnownBuiltFieldNames<Schema, Input>>>;

type NoUnknownBuildFields<
  Schema extends SchemaDefinition,
  Input extends BuildInput<Schema>,
> = Input & Record<Exclude<keyof Input, keyof RowFromSchema<Schema>>, never>;

export class Model<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike = Adapter,
> {
  declare readonly $inferPrimaryKey: PrimaryKeyNames<Schema>;

  readonly name: Name;
  readonly parent: Toshihiko<AdapterInstance>;
  readonly originalSchema: Schema;
  readonly options: ModelOptions;
  readonly schema: CompiledSchema<Schema>;
  readonly primaryKeys: readonly Field<Schema[number]>[];
  readonly autoIncrementField: Field<Schema[number]> | null;
  readonly ai: Field<Schema[number]> | null;
  readonly nameToColumn: NameToColumnMap<Schema>;
  readonly columnToName: Readonly<Record<string, FieldName<RowFromSchema<Schema>>>>;
  readonly fieldNamesMap: FieldNamesMap<Schema>;

  constructor(
    name: Name,
    parent: Toshihiko<AdapterInstance>,
    schema: Schema,
    options: ModelOptions = {},
  ) {
    this.name = name;
    this.parent = parent;
    this.originalSchema = schema;
    this.options = options;

    for (const definition of schema) {
      if (isReservedYukariFieldName(definition.name)) {
        throw new TypeError(`Field name ${definition.name} is reserved by Yukari.`);
      }
    }

    const compiled = schema.map((definition) => new Field(
      definition as Schema[number] & ValidatedFieldDefinition<Schema[number]>,
    )) as CompiledSchema<Schema>;
    const primaryKeys: Field<Schema[number]>[] = [];
    const nameToColumn: Record<string, string> = {};
    const columnToName: Record<string, FieldName<RowFromSchema<Schema>>> = {};
    const fieldNamesMap: Record<string, Field<Schema[number]>> = {};
    let autoIncrementField: Field<Schema[number]> | null = null;

    for (const field of compiled) {
      if (field.primaryKey) {
        primaryKeys.push(field);
      }
      if (field.autoIncrement) {
        autoIncrementField = field;
      }

      nameToColumn[field.name] = field.column;
      columnToName[field.column] = field.name as FieldName<RowFromSchema<Schema>>;
      fieldNamesMap[field.name] = field;
    }

    this.schema = compiled;
    this.primaryKeys = primaryKeys;
    this.autoIncrementField = autoIncrementField;
    this.ai = autoIncrementField;
    this.nameToColumn = nameToColumn as NameToColumnMap<Schema>;
    this.columnToName = columnToName;
    this.fieldNamesMap = fieldNamesMap as unknown as FieldNamesMap<Schema>;
  }

  build<const Input extends BuildInput<Schema>>(
    fields: NoUnknownBuildFields<Schema, Input>,
  ): BuiltYukari<Name, Schema, Input, AdapterInstance> {
    const yukari = new Yukari<Name, Schema, AdapterInstance>(this, 'new');
    yukari.buildNewRow(fields);
    return yukari as BuiltYukari<Name, Schema, Input, AdapterInstance>;
  }

  where(condition: QueryWhere<RowFromSchema<Schema>>): Query<Name, Schema, AdapterInstance> {
    return new Query(this).where(condition);
  }

  field(
    fields: string | readonly FieldName<RowFromSchema<Schema>>[],
  ): Query<Name, Schema, AdapterInstance> {
    return new Query(this).fields(fields);
  }

  fields(
    fields: string | readonly FieldName<RowFromSchema<Schema>>[],
  ): Query<Name, Schema, AdapterInstance> {
    return new Query(this).fields(fields);
  }

  limit(limit: number | string | readonly (number | string)[]): Query<Name, Schema, AdapterInstance>;
  limit(offset: number | string, count: number | string): Query<Name, Schema, AdapterInstance>;
  limit(
    first: number | string | readonly (number | string)[],
    second?: number | string,
  ): Query<Name, Schema, AdapterInstance> {
    const query = new Query(this);
    return second === undefined
      ? query.limit(first)
      : query.limit(normalizeModelLimit(first), second);
  }

  index(indexName: string): Query<Name, Schema, AdapterInstance> {
    return new Query(this).index(indexName);
  }

  order(order: QueryOrder<RowFromSchema<Schema>>): Query<Name, Schema, AdapterInstance> {
    return new Query(this).order(order);
  }

  orderBy(order: QueryOrder<RowFromSchema<Schema>>): Query<Name, Schema, AdapterInstance> {
    return new Query(this).orderBy(order);
  }

  conn(connection: AdapterConnection<AdapterInstance>): Query<Name, Schema, AdapterInstance> {
    return new Query(this).conn(connection);
  }

  find(): Promise<readonly QueriedYukari<Name, Schema, AdapterInstance>[]>;
  find(
    toJSON: false,
    options?: QueryFindOptions,
  ): Promise<readonly QueriedYukari<Name, Schema, AdapterInstance>[]>;
  find(
    toJSON: true,
    options?: QueryFindOptions,
  ): Promise<readonly QueryJsonRow<Schema>[]>;
  find(
    toJSON = false,
    options: QueryFindOptions = {},
  ): Promise<readonly QueriedYukari<Name, Schema, AdapterInstance>[]> | Promise<readonly QueryJsonRow<Schema>[]> {
    return toJSON
      ? new Query(this).find(true, options)
      : new Query(this).find(false, options);
  }

  findOne(): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  findOne(toJSON: false): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  findOne(toJSON: true): Promise<QueryJsonRow<Schema> | null>;
  findOne(
    toJSON = false,
  ): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null> | Promise<QueryJsonRow<Schema> | null> {
    return toJSON ? new Query(this).findOne(true) : new Query(this).findOne(false);
  }

  findById(
    id: FindByIdInput<Schema>,
  ): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  findById(
    id: FindByIdInput<Schema>,
    toJSON: false,
  ): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  findById(
    id: FindByIdInput<Schema>,
    toJSON: true,
  ): Promise<QueryJsonRow<Schema> | null>;
  findById(
    id: FindByIdInput<Schema>,
    toJSON = false,
  ): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null> | Promise<QueryJsonRow<Schema> | null> {
    const query = new Query(this);
    return toJSON ? query.findById(id, true) : query.findById(id, false);
  }
}

function normalizeModelLimit(
  value: number | string | readonly (number | string)[],
): number | string {
  return isReadonlyArray(value) ? value[0] ?? 0 : value;
}

function isReadonlyArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

export type InferModelRow<ModelType> = ModelType extends Model<
  string,
  infer Schema,
  AdapterLike
>
  ? RowFromSchema<Schema>
  : never;

export type InferModelPrimaryKey<ModelType> = ModelType extends Model<
  string,
  infer Schema,
  AdapterLike
>
  ? PrimaryKeyNames<Schema>
  : never;
