import type { FieldName } from './common';
import { Yukari, type BuiltYukari } from '../yukari';
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
  Definition extends { readonly default: unknown } | { readonly defaultValue: unknown }
    ? Definition
    : FieldTypeFromDefinition<Definition> extends { readonly defaultValue: unknown }
      ? Definition
      : never;

type DefaultedFieldNames<Schema extends SchemaDefinition> =
  DefaultedDefinition<Schema[number]>['name'];

type KnownBuiltFieldNames<
  Schema extends SchemaDefinition,
  Input extends BuildInput<Schema>,
> = Extract<keyof Input | DefaultedFieldNames<Schema>, keyof RowFromSchema<Schema>>;

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
> {
  declare readonly row: RowFromSchema<Schema>;
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
    schema: Schema,
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
    this.fieldNamesMap = fieldNamesMap as unknown as FieldNamesMap<Schema>;
  }

  build<const Input extends BuildInput<Schema>>(
    fields: NoUnknownBuildFields<Schema, Input>,
  ): BuiltYukari<Name, Schema, Input> {
    const yukari = new Yukari<Name, Schema>(this, 'new');
    yukari.buildNewRow(fields);
    return yukari as BuiltYukari<Name, Schema, Input>;
  }
}

export type InferModelRow<ModelType> = ModelType extends { readonly row: infer Row }
  ? Row
  : never;

export type InferModelPrimaryKey<ModelType> = ModelType extends Model<
  string,
  infer Schema
>
  ? PrimaryKeyNames<Schema>
  : never;
