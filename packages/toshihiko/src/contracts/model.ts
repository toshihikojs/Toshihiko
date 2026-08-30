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
  type SchemaFieldDefinition,
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

/**
 * Options shared by models created with {@link Toshihiko.define}.
 *
 * @category Application API
 */
export interface ModelOptions {
  /** Model-specific Cache, `false`/`null` to disable, or omitted to inherit. */
  readonly cache?: CacheSource | false | null;
  readonly [key: string]: DataValue;
}

type ValidatedModelMethods<Methods extends object> = {
  readonly [Name in keyof Methods]: Methods[Name] extends (
    ...arguments_: never[]
  ) => void ? Methods[Name] : never;
};

/**
 * Options accepted while defining a model.
 *
 * @category Application API
 */
export type ModelDefinitionOptions<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike,
  Methods extends object,
> = ModelOptions & {
  /** Functions copied onto the returned Model with a contextually typed `this`. */
  readonly methods?: Methods & ValidatedModelMethods<Methods> & ThisType<
    Model<Name, Schema, AdapterInstance> & Methods
  >;
};

type ColumnName<Definition extends SchemaFieldDefinition> =
  Definition extends { readonly column: infer Column extends string }
    ? Column extends '' ? Definition['name'] : Column
    : Definition['name'];

/** Maps every schema entry to its runtime Field. */
export type CompiledSchema<Schema extends SchemaDefinition> = {
  readonly [Index in keyof Schema]: Schema[Index] extends SchemaFieldDefinition
    ? Field<Schema[Index]>
    : never;
};

/** Maps logical schema field names to storage column names. */
export type NameToColumnMap<Schema extends SchemaDefinition> = {
  readonly [Definition in Schema[number] as Definition['name']]: ColumnName<Definition>;
};

/** Maps logical schema field names to compiled Fields. */
export type FieldNamesMap<Schema extends SchemaDefinition> = {
  readonly [Definition in Schema[number] as Definition['name']]: Field<Definition>;
};

/** Schema-restricted input accepted by {@link Model.build}. */
export type BuildInput<Schema extends SchemaDefinition> = Partial<RowFromSchema<Schema>>;

type TypeDefaultedDefinition<Definition extends SchemaFieldDefinition> =
  FieldTypeFromDefinition<Definition> extends { readonly defaultValue: infer Value }
    ? undefined extends Value ? never : Definition
    : never;

type DefaultedDefinition<Definition extends SchemaFieldDefinition> =
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

/**
 * Row shape returned by `build()`: supplied and defaulted fields are known,
 * while the remaining schema fields stay optional.
 */
export type BuiltRowFromSchema<
  Schema extends SchemaDefinition,
  Input extends BuildInput<Schema>,
> = Pick<RowFromSchema<Schema>, KnownBuiltFieldNames<Schema, Input>>
  & Partial<Omit<RowFromSchema<Schema>, KnownBuiltFieldNames<Schema, Input>>>;

type NoUnknownBuildFields<
  Schema extends SchemaDefinition,
  Input extends BuildInput<Schema>,
> = Input & Record<Exclude<keyof Input, keyof RowFromSchema<Schema>>, never>;

/**
 * The table-level API returned by {@link Toshihiko.define}.
 *
 * A Model compiles the supplied schema, creates Query builders, constructs
 * Yukari rows, and exposes schema-aware metadata. Query entry methods always
 * create a fresh Query instance.
 *
 * @category Application API
 */
export class Model<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike = Adapter,
> extends EventEmitter2 {
  /** Table or collection name passed to {@link Toshihiko.define}. */
  declare readonly name: Name;
  /** Toshihiko instance which owns this Model. */
  declare readonly parent: Toshihiko<AdapterInstance>;
  /** Exact schema array passed to {@link Toshihiko.define}. */
  declare readonly originalSchema: Schema;
  /** Model options passed to {@link Toshihiko.define}. */
  declare readonly options: ModelOptions;
  /** Runtime Field objects compiled from {@link originalSchema}. */
  declare readonly schema: CompiledSchema<Schema>;
  /** Compiled fields marked with `primaryKey: true`. */
  declare readonly primaryKeys: readonly Field<Schema[number]>[];
  /** Compiled field marked with `autoIncrement: true`, when present. */
  declare readonly autoIncrementField: Field<Schema[number]> | null;
  /** Compatibility alias for {@link autoIncrementField}. */
  declare ai: Field<Schema[number]> | null;
  /** Logical field name to storage column name. */
  declare readonly nameToColumn: NameToColumnMap<Schema>;
  /** Storage column name to logical field name. */
  declare readonly columnToName: Readonly<Record<string, FieldName<RowFromSchema<Schema>>>>;
  /** Logical field name to compiled Field. */
  declare readonly fieldNamesMap: FieldNamesMap<Schema>;
  /** Storage column name to compiled Field. */
  declare readonly fieldColumnsMap: Readonly<Record<string, Field<Schema[number]>>>;
  /** Cache selected by Model options or inherited from the parent Toshihiko. */
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

  /** Compatibility getter for {@link parent}. */
  get toshihiko(): Toshihiko<AdapterInstance> {
    return this.parent;
  }

  /**
   * Begins a transaction through the selected Adapter.
   *
   * This method is callable only when the Adapter declares transaction support.
   *
   * @returns The Adapter-specific transaction connection.
   */
  beginTransaction(
    ...support: AdapterBeginTransactionArguments<AdapterInstance>
  ): Promise<AdapterTransactionConnection<AdapterInstance>> {
    void support;
    const adapter = getAdapterInstance(this.parent) as unknown as {
      beginTransaction(): Promise<AdapterTransactionConnection<AdapterInstance>>;
    };
    return adapter.beginTransaction();
  }

  /**
   * Commits an Adapter transaction connection.
   *
   * @param connection - Connection returned by {@link beginTransaction}.
   * @returns The Adapter-defined commit result.
   */
  commit(
    ...[connection]: AdapterCommitArguments<AdapterInstance>
  ): Promise<AdapterCommitResult<AdapterInstance>> {
    const adapter = getAdapterInstance(this.parent) as unknown as {
      commit(value: AdapterTransactionConnection<AdapterInstance>): Promise<AdapterCommitResult<AdapterInstance>>;
    };
    return adapter.commit(connection);
  }

  /**
   * Rolls back an Adapter transaction connection.
   *
   * @param connection - Connection returned by {@link beginTransaction}.
   * @returns The Adapter-defined rollback result.
   */
  rollback(
    ...[connection]: AdapterRollbackArguments<AdapterInstance>
  ): Promise<AdapterRollbackResult<AdapterInstance>> {
    const adapter = getAdapterInstance(this.parent) as unknown as {
      rollback(value: AdapterTransactionConnection<AdapterInstance>): Promise<AdapterRollbackResult<AdapterInstance>>;
    };
    return adapter.rollback(connection);
  }

  /**
   * Creates a new Yukari row without writing it.
   *
   * Input keys are restricted to schema fields. Supplied fields and fields with
   * defaults are known to exist on the returned type; other fields remain
   * optional until assigned or loaded.
   *
   * @param fields - Initial application values keyed by logical field name.
   * @returns A newly built Yukari ready for {@link Yukari.insert} or
   * {@link Yukari.save}.
   *
   * @example
   * ```ts
   * const user = User.build({ email: 'yukari@example.com' });
   * await user.save();
   * ```
   */
  build<const Input extends BuildInput<Schema>>(
    fields: NoUnknownBuildFields<Schema, Input>,
  ): BuiltYukari<Name, Schema, Input, AdapterInstance> {
    const yukari = new Yukari<Name, Schema, AdapterInstance>(this, 'new', fields);
    return yukari as BuiltYukari<Name, Schema, Input, AdapterInstance>;
  }

  /** Creates a fresh Query and applies {@link Query.where}. */
  where(condition: QueryWhere<RowFromSchema<Schema>>): Query<Name, Schema, AdapterInstance> {
    return new Query(this).where(condition);
  }

  /** Creates a fresh Query and applies the {@link Query.field} alias. */
  field(
    fields: string | readonly FieldName<RowFromSchema<Schema>>[],
  ): Query<Name, Schema, AdapterInstance> {
    return new Query(this).fields(fields);
  }

  /** Creates a fresh Query and applies {@link Query.fields}. */
  fields(
    fields: string | readonly FieldName<RowFromSchema<Schema>>[],
  ): Query<Name, Schema, AdapterInstance> {
    return new Query(this).fields(fields);
  }

  /** Creates a fresh Query and applies {@link Query.limit}. */
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

  /** Creates a fresh Query and applies {@link Query.index}. */
  index(indexName: string): Query<Name, Schema, AdapterInstance> {
    return new Query(this).index(indexName);
  }

  /** Creates a fresh Query and applies {@link Query.order}. */
  order(order: QueryOrder<RowFromSchema<Schema>>): Query<Name, Schema, AdapterInstance> {
    return new Query(this).order(order);
  }

  /** Creates a fresh Query and applies the {@link Query.orderBy} alias. */
  orderBy(order: QueryOrder<RowFromSchema<Schema>>): Query<Name, Schema, AdapterInstance> {
    return new Query(this).orderBy(order);
  }

  /** Creates a fresh Query and applies {@link Query.conn}. */
  conn(connection: AdapterConnection<AdapterInstance> | null): Query<Name, Schema, AdapterInstance> {
    return new Query(this).conn(connection);
  }

  /** Counts all rows through a fresh Query. */
  count(): Promise<number> {
    return new Query(this).count();
  }

  /**
   * Updates rows through a fresh Query with no condition.
   *
   * Use {@link where} first unless updating the entire table is intentional.
   */
  update(
    data: Partial<RowFromSchema<Schema>>,
    ...support: AdapterUpdateByQueryCallArguments<AdapterInstance>
  ): Promise<AdapterUpdateByQueryResult<AdapterInstance>> {
    return new Query(this).update(data, ...support);
  }

  /**
   * Deletes rows through a fresh Query with no condition.
   *
   * Use {@link where} first unless deleting the entire table is intentional.
   */
  delete(): Promise<AdapterDeleteByQueryResult<AdapterInstance>> {
    return new Query(this).delete();
  }

  /** Executes an Adapter-specific raw operation through a fresh Query. */
  execute(
    ...arguments_: AdapterQueryExecuteArguments<AdapterInstance>
  ): Promise<AdapterExecuteResult<AdapterInstance>> {
    return new Query(this).execute(...arguments_);
  }

  /**
   * Finds rows through a fresh Query.
   *
   * The overloads and serialization behavior match {@link Query.find}.
   */
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

  /** Finds at most one row through a fresh Query. */
  findOne(): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  findOne(toJSON: false): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  findOne(toJSON: true): Promise<QueryJsonRow<Schema> | null>;
  findOne(
    toJSON = false,
  ): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null> | Promise<QueryJsonRow<Schema> | null> {
    return toJSON ? new Query(this).findOne(true) : new Query(this).findOne(false);
  }

  /**
   * Finds one row by primary key through a fresh Query.
   *
   * @param id - Single primary-key value or composite-key object.
   */
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

  /**
   * Converts storage column names to logical schema field names.
   *
   * Unknown columns return `undefined` for string or array input and are omitted
   * from object input.
   *
   * @param column - One storage column name. Overloads also accept an array of
   * column names or a row keyed by column name.
   * @returns The corresponding logical name or converted structure.
   */
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

  /**
   * Returns logical primary-key names.
   *
   * @returns One string for a single key, an array for composite keys, or an
   * empty array when the Model has no primary key.
   */
  getPrimaryKeysName(): string | readonly string[] {
    if (this.primaryKeys.length === 0) return [];
    if (this.primaryKeys.length === 1) return this.primaryKeys[0]!.name;
    return this.primaryKeys.map((field) => field.name);
  }

  /**
   * Returns storage column names for primary keys.
   *
   * @returns One string for a single key, an array for composite keys, or an
   * empty array when the Model has no primary key.
   */
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

/** Extracts the complete application row type from a Model. */
export type InferModelRow<ModelType> = ModelType extends Model<
  string,
  infer Schema,
  infer _AdapterInstance extends AdapterLike
>
  ? RowFromSchema<Schema>
  : never;

/** Extracts logical primary-key field names from a Model. */
export type InferModelPrimaryKey<ModelType> = ModelType extends Model<
  string,
  infer Schema,
  infer _AdapterInstance extends AdapterLike
>
  ? PrimaryKeyNames<Schema>
  : never;
