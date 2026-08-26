import type { FieldName } from './common';
import {
  Field,
  type FieldDefinitionShape,
  type PrimaryKeyNames,
  type RowFromSchema,
  type SchemaDefinition,
  type ValidatedFieldDefinition,
  type ValidatedSchema,
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

export class Model<
  Name extends string,
  Schema extends SchemaDefinition,
> {
  declare readonly $inferRow: RowFromSchema<Schema>;
  declare readonly $inferPrimaryKey: PrimaryKeyNames<Schema>;

  readonly name: Name;
  readonly parent: Toshihiko;
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
    parent: Toshihiko,
    schema: Schema & ValidatedSchema<Schema>,
    options: ModelOptions = {},
  ) {
    this.name = name;
    this.parent = parent;
    this.originalSchema = schema;
    this.options = options;

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
    this.fieldNamesMap = fieldNamesMap as FieldNamesMap<Schema>;
  }
}

export type InferModelRow<ModelType> = ModelType extends Model<
  string,
  infer Schema
>
  ? RowFromSchema<Schema>
  : never;

export type InferModelPrimaryKey<ModelType> = ModelType extends Model<
  string,
  infer Schema
>
  ? PrimaryKeyNames<Schema>
  : never;
