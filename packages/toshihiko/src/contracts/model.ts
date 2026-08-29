import { EventEmitter2 } from 'eventemitter2';
import type { FieldName } from './common';
import type { DataRow, DataValue } from './common';
import type {
  Adapter,
  AdapterBeginTransactionArguments,
  AdapterCommitArguments,
  AdapterCommitResult,
  AdapterConnection,
  AdapterDeleteByQueryResult,
  AdapterExecuteResult,
  AdapterLike,
  AdapterQueryExecuteArguments,
  AdapterRollbackArguments,
  AdapterRollbackResult,
  AdapterTransactionConnection,
  AdapterUpdateByQueryResult,
  AdapterUpdateByQueryCallArguments,
} from './adapter';
import {
  Yukari,
  type BuiltYukari,
  type QueriedYukari,
} from '../yukari';
import {
  Query,
  type FindByIdInput,
  type QueryFindManyOptions,
  type QueryFindOneOptions,
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
import { getAdapterInstance, type Toshihiko } from '../toshihiko';
import {
  createCache,
  type Cache,
  type CacheSource,
} from './cache';

export interface ModelOptions {
  readonly cache?: CacheSource | false | null;
  readonly [key: string]: DataValue;
}

type ValidatedModelMethods<Methods extends object> = {
  readonly [Name in keyof Methods]: Methods[Name] extends (
    ...arguments_: never[]
  ) => void ? Methods[Name] : never;
};

export type ModelDefinitionOptions<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike,
  Methods extends object,
> = ModelOptions & {
  readonly methods?: Methods & ValidatedModelMethods<Methods> & ThisType<
    Model<Name, Schema, AdapterInstance> & Methods
  >;
};

type ColumnName<Definition extends FieldDefinitionShape> =
  Definition extends { readonly column: infer Column extends string }
    ? Column extends '' ? Definition['name'] : Column
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

type TypeDefaultedDefinition<Definition extends FieldDefinitionShape> =
  FieldTypeFromDefinition<Definition> extends { readonly defaultValue: infer Value }
    ? undefined extends Value ? never : Definition
    : never;

type DefaultedDefinition<Definition extends FieldDefinitionShape> =
  Definition extends { readonly defaultValue: infer Value }
    ? undefined extends Value ? TypeDefaultedDefinition<Definition> : Definition
    : TypeDefaultedDefinition<Definition>;

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
> extends EventEmitter2 {
  declare readonly name: Name;
  declare readonly parent: Toshihiko<AdapterInstance>;
  declare readonly originalSchema: Schema;
  declare readonly options: ModelOptions;
  declare readonly schema: CompiledSchema<Schema>;
  declare readonly primaryKeys: readonly Field<Schema[number]>[];
  declare readonly autoIncrementField: Field<Schema[number]> | null;
  declare ai: Field<Schema[number]> | null;
  declare readonly nameToColumn: NameToColumnMap<Schema>;
  declare readonly columnToName: Readonly<Record<string, FieldName<RowFromSchema<Schema>>>>;
  declare readonly fieldNamesMap: FieldNamesMap<Schema>;
  declare readonly fieldColumnsMap: Readonly<Record<string, Field<Schema[number]>>>;
  declare readonly cache: Cache | null;

  constructor(
    name: Name,
    parent: Toshihiko<AdapterInstance>,
    schema: Schema,
    options: ModelOptions = {},
  ) {
    super();
    const resolvedOptions = options || {};
    const compiled = schema.map((definition) => new Field(
      definition as Schema[number] & ValidatedFieldDefinition<Schema[number]>,
    )) as CompiledSchema<Schema>;
    const primaryKeys: Field<Schema[number]>[] = [];
    const nameToColumn: Record<string, string> = {};
    const columnToName: Record<string, FieldName<RowFromSchema<Schema>>> = {};
    const fieldNamesMap: Record<string, Field<Schema[number]>> = {};
    const fieldColumnsMap: Record<string, Field<Schema[number]>> = {};
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
      fieldColumnsMap[field.column] = field;
    }

    const typedNameToColumn = nameToColumn as NameToColumnMap<Schema>;
    const typedFieldNamesMap = fieldNamesMap as unknown as FieldNamesMap<Schema>;
    const cache = resolvedOptions.cache
      ? createCache(resolvedOptions.cache)
      : resolvedOptions.cache === undefined && parent.cache
        ? parent.cache
        : null;

    Object.defineProperties(this, {
      ai: { enumerable: true, value: autoIncrementField, writable: true },
      autoIncrementField: { value: autoIncrementField },
      cache: { enumerable: true, value: cache },
      columnToName: { value: columnToName },
      fieldColumnsMap: { value: fieldColumnsMap },
      fieldNamesMap: { value: typedFieldNamesMap },
      name: { enumerable: true, value: name },
      nameToColumn: { value: typedNameToColumn },
      options: { value: resolvedOptions },
      originalSchema: { value: schema },
      parent: { value: parent },
      primaryKeys: { enumerable: true, value: primaryKeys },
      schema: { enumerable: true, value: compiled },
    });

    if (this.primaryKeys.length === 0) {
      this.emit('log', `!!! WARNING: YOU'D BETTER ADD PRIMARY KEY(S) IN MODEL ${this.name} !!!`);
    }
  }

  get toshihiko(): Toshihiko<AdapterInstance> {
    return this.parent;
  }

  beginTransaction(
    ...support: AdapterBeginTransactionArguments<AdapterInstance>
  ): Promise<AdapterTransactionConnection<AdapterInstance>> {
    void support;
    const adapter = getAdapterInstance(this.parent) as unknown as {
      beginTransaction(): Promise<AdapterTransactionConnection<AdapterInstance>>;
    };
    return adapter.beginTransaction();
  }

  commit(
    ...[connection]: AdapterCommitArguments<AdapterInstance>
  ): Promise<AdapterCommitResult<AdapterInstance>> {
    const adapter = getAdapterInstance(this.parent) as unknown as {
      commit(value: AdapterTransactionConnection<AdapterInstance>): Promise<AdapterCommitResult<AdapterInstance>>;
    };
    return adapter.commit(connection);
  }

  rollback(
    ...[connection]: AdapterRollbackArguments<AdapterInstance>
  ): Promise<AdapterRollbackResult<AdapterInstance>> {
    const adapter = getAdapterInstance(this.parent) as unknown as {
      rollback(value: AdapterTransactionConnection<AdapterInstance>): Promise<AdapterRollbackResult<AdapterInstance>>;
    };
    return adapter.rollback(connection);
  }

  build<const Input extends BuildInput<Schema>>(
    fields: NoUnknownBuildFields<Schema, Input>,
  ): BuiltYukari<Name, Schema, Input, AdapterInstance> {
    const yukari = new Yukari<Name, Schema, AdapterInstance>(this, 'new', fields);
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
    return arguments.length <= 1
      ? query.limit(first)
      : query.limit(normalizeModelLimit(first), second as number | string);
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

  conn(connection: AdapterConnection<AdapterInstance> | null): Query<Name, Schema, AdapterInstance> {
    return new Query(this).conn(connection);
  }

  count(): Promise<number> {
    return new Query(this).count();
  }

  update(
    data: Partial<RowFromSchema<Schema>>,
    ...support: AdapterUpdateByQueryCallArguments<AdapterInstance>
  ): Promise<AdapterUpdateByQueryResult<AdapterInstance>> {
    return new Query(this).update(data, ...support);
  }

  delete(): Promise<AdapterDeleteByQueryResult<AdapterInstance>> {
    return new Query(this).delete();
  }

  execute(
    ...arguments_: AdapterQueryExecuteArguments<AdapterInstance>
  ): Promise<AdapterExecuteResult<AdapterInstance>> {
    return new Query(this).execute(...arguments_);
  }

  find(): Promise<readonly QueriedYukari<Name, Schema, AdapterInstance>[]>;
  find(
    options: QueryFindManyOptions,
  ): Promise<readonly QueriedYukari<Name, Schema, AdapterInstance>[]>;
  find(
    options: QueryFindOneOptions,
  ): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  find(
    toJSON: false,
    options?: QueryFindManyOptions,
  ): Promise<readonly QueriedYukari<Name, Schema, AdapterInstance>[]>;
  find(
    toJSON: false,
    options: QueryFindOneOptions,
  ): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  find(
    toJSON: true,
    options?: QueryFindManyOptions,
  ): Promise<readonly QueryJsonRow<Schema>[]>;
  find(
    toJSON: true,
    options: QueryFindOneOptions,
  ): Promise<QueryJsonRow<Schema> | null>;
  find(
    options: QueryFindManyOptions,
    toJSON: true,
  ): Promise<readonly QueryJsonRow<Schema>[]>;
  find(
    options: QueryFindOneOptions,
    toJSON: false,
  ): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  find(
    options: QueryFindOneOptions,
    toJSON: true,
  ): Promise<QueryJsonRow<Schema> | null>;
  find(
    toJSONOrOptions: boolean | QueryFindOptions = false,
    options?: boolean | QueryFindOptions,
  ): Promise<
    | readonly QueriedYukari<Name, Schema, AdapterInstance>[]
    | QueriedYukari<Name, Schema, AdapterInstance>
    | readonly QueryJsonRow<Schema>[]
    | QueryJsonRow<Schema>
    | null
  > {
    const query = new Query(this);
    const find = query.find as (
      first: boolean | QueryFindOptions,
      second?: boolean | QueryFindOptions,
    ) => Promise<
      | readonly QueriedYukari<Name, Schema, AdapterInstance>[]
      | QueriedYukari<Name, Schema, AdapterInstance>
      | readonly QueryJsonRow<Schema>[]
      | QueryJsonRow<Schema>
      | null
    >;
    return find.call(query, toJSONOrOptions, options);
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

  convertColumnToName(column: string): FieldName<RowFromSchema<Schema>> | undefined;
  convertColumnToName(columns: readonly string[]): readonly (FieldName<RowFromSchema<Schema>> | undefined)[];
  convertColumnToName(object: DataRow): DataRow;
  convertColumnToName(object: unknown): unknown {
    if (typeof object === 'string') return this.columnToName[object];
    if (Array.isArray(object)) return object.map((column) => this.columnToName[column]);
    if (object !== null && typeof object === 'object') {
      const result: Record<string, unknown> = {};
      for (const [column, value] of Object.entries(object)) {
        const name = this.columnToName[column];
        if (name !== undefined) result[name] = value;
      }
      return result;
    }
    return undefined;
  }

  getPrimaryKeysName(): string | readonly string[] {
    if (this.primaryKeys.length === 0) return [];
    if (this.primaryKeys.length === 1) return this.primaryKeys[0]!.name;
    return this.primaryKeys.map((field) => field.name);
  }

  getPrimaryKeysColumn(): string | readonly string[] {
    if (this.primaryKeys.length === 0) return [];
    if (this.primaryKeys.length === 1) return this.primaryKeys[0]!.column;
    return this.primaryKeys.map((field) => field.column);
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
  infer _AdapterInstance extends AdapterLike
>
  ? RowFromSchema<Schema>
  : never;

export type InferModelPrimaryKey<ModelType> = ModelType extends Model<
  string,
  infer Schema,
  infer _AdapterInstance extends AdapterLike
>
  ? PrimaryKeyNames<Schema>
  : never;
