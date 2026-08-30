import type {
  Adapter,
  AdapterConnection,
  AdapterCountQueryType,
  AdapterDeleteByQueryResult,
  AdapterDeleteQueryType,
  AdapterExecuteResult,
  AdapterFindOptions,
  AdapterFindResult,
  AdapterLike,
  AdapterQuery,
  AdapterQueryExecuteArguments,
  AdapterQueryType,
  AdapterRow,
  AdapterUpdateByQueryResult,
  AdapterUpdateByQueryCallArguments,
  AdapterUpdateByQueryType,
} from './contracts/adapter';
import type { DataRow, FieldName } from './contracts/common';
import type {
  JsonRowFromSchema,
  RowFromSchema,
  SchemaDefinition,
} from './contracts/field';
import type { Model } from './contracts/model';
import { Yukari, type QueriedYukari } from './yukari';
import type { Cache } from './contracts/cache';
import { getAdapterInstance } from './toshihiko';

/**
 * Sort direction accepted by {@link Query.order}.
 *
 * @category Application API
 */
export type QueryOrderDirection = number | 'asc' | 'ASC' | 'desc' | 'DESC';

/**
 * Operators accepted for one field in a query condition.
 *
 * @category Application API
 */
export interface QueryFieldOperators<Value> {
  /** Requires all supplied values or nested field conditions. */
  readonly $and?: Value | readonly Value[];
  /** Inclusive two-value range. */
  readonly $between?: readonly [Value, Value];
  /** Equality comparison. */
  readonly $eq?: Value;
  /** Greater-than comparison. */
  readonly $gt?: Value;
  /** Greater-than-or-equal comparison. */
  readonly $gte?: Value;
  /** Membership comparison. */
  readonly $in?: readonly Value[];
  /** Adapter-defined pattern comparison. */
  readonly $like?: Value;
  /** Less-than comparison. */
  readonly $lt?: Value;
  /** Less-than-or-equal comparison. */
  readonly $lte?: Value;
  /** Inequality comparison. */
  readonly $neq?: Value;
  /** Requires any supplied value or nested field condition. */
  readonly $or?: Value | readonly Value[];
  /** Alias of `$lt`. */
  readonly '<'?: Value;
  /** Alias of `$lte`. */
  readonly '<='?: Value;
  /** Alias of `$eq`. */
  readonly '==='?: Value;
  /** Alias of `$gt`. */
  readonly '>'?: Value;
  /** Alias of `$gte`. */
  readonly '>='?: Value;
  /** Alias of `$neq`. */
  readonly '!=='?: Value;
}

/**
 * A direct value or an operator object for one field.
 *
 * @category Application API
 */
export type QueryFieldCondition<Value> = Value | QueryFieldOperators<Value>;

/**
 * A typed query condition for a model row.
 *
 * @category Application API
 */
export type QueryWhere<Row extends object> = {
  readonly [Name in keyof Row]?: QueryFieldCondition<Row[Name]>;
} & {
  readonly $and?: QueryWhere<Row> | readonly QueryWhere<Row>[];
  readonly $or?: QueryWhere<Row> | readonly QueryWhere<Row>[];
};

/**
 * Sort expressions accepted by {@link Query.order}.
 *
 * @category Application API
 */
export type QueryOrder<Row extends object> =
  | string
  | Readonly<Partial<Record<FieldName<Row>, QueryOrderDirection>>>
  | readonly (
    | string
    | Readonly<Partial<Record<FieldName<Row>, QueryOrderDirection>>>
  )[];

/**
 * Options shared by query find operations.
 *
 * @category Application API
 */
export interface QueryFindOptions {
  /** Tell the Adapter to bypass query-result caching. */
  readonly noCache?: boolean;
  /** Ask the Adapter for at most one result. */
  readonly single?: boolean;
}

/**
 * Options which request multiple rows.
 *
 * @category Application API
 */
export interface QueryFindManyOptions extends QueryFindOptions {
  readonly single?: false;
}

/**
 * Options which request one row.
 *
 * @category Application API
 */
export interface QueryFindOneOptions extends QueryFindOptions {
  readonly single: true;
}

/** Serialized partial row returned by a field-selecting Query. */
export type QueryJsonRow<Schema extends SchemaDefinition> = Partial<
  JsonRowFromSchema<Schema>
>;

type PrimaryKeyName<Schema extends SchemaDefinition> = Extract<
  Schema[number],
  { readonly primaryKey: true }
>['name'];

/** Primary-key value or object accepted by {@link Query.findById}. */
export type FindByIdInput<Schema extends SchemaDefinition> =
  [PrimaryKeyName<Schema>] extends [never]
    ? DataRow
    : RowFromSchema<Schema>[PrimaryKeyName<Schema>]
      | DataRow;

/** Schema-aware normalized Query passed to an Adapter implementation. */
export interface QueryAdapterData<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike,
> extends AdapterQuery<
  Model<Name, Schema, AdapterInstance>,
  AdapterConnection<AdapterInstance>,
  Cache | null,
  Partial<RowFromSchema<Schema>>,
  QueryWhere<RowFromSchema<Schema>>
> {
  readonly updateData: Partial<RowFromSchema<Schema>>;
  readonly where: QueryWhere<RowFromSchema<Schema>>;
}

/**
 * A mutable, chainable description of one database operation.
 *
 * Builder methods replace or extend the current Query state and return this
 * same instance. Start again from the Model when two independent operations
 * need different conditions, fields, limits, or connections.
 *
 * @category Application API
 */
export class Query<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike = Adapter,
> {
  readonly #adapter: AdapterInstance;
  readonly #cache: Cache | null;
  #connection: AdapterConnection<AdapterInstance> | null = null;
  #fields: string[];
  #index = '';
  #limit: number[] = [];
  readonly #model: Model<Name, Schema, AdapterInstance>;
  #order: Readonly<Record<string, number>>[] = [];
  readonly #toshihiko: Model<Name, Schema, AdapterInstance>['parent'];
  #updateData: Partial<RowFromSchema<Schema>> = {};
  #where: QueryWhere<RowFromSchema<Schema>> = {};

  /** Creates an empty Query selecting every field from the supplied Model. */
  constructor(model: Model<Name, Schema, AdapterInstance>) {
    this.#adapter = getAdapterInstance(model.parent);
    this.#cache = model.cache;
    this.#model = model;
    this.#toshihiko = model.parent;
    Object.defineProperties(this, {
      field: { value: this.fields, writable: true },
      orderBy: { value: this.order, writable: true },
    });
    this.#fields = model.schema.map((field) => field.name);
  }

  /**
   * Sets an Adapter-specific index hint.
   *
   * @param indexName - Index name passed to the Adapter without interpretation.
   * @returns This Query.
   */
  index(indexName: string): this {
    this.#index = indexName;
    return this;
  }

  /**
   * Replaces the current query condition.
   *
   * A later call does not merge with an earlier condition. Use `$and` or `$or`
   * inside one condition when multiple branches are required.
   *
   * @param condition - Field-aware condition object.
   * @returns This Query.
   * @throws When the runtime value is not an object.
   */
  where(condition: QueryWhere<RowFromSchema<Schema>>): this {
    if (typeof condition !== 'object') {
      throw new Error(`query condition expected to be an object but got ${typeof condition} ${String(condition)}.`);
    }

    this.#where = condition;
    return this;
  }

  /** Compatibility alias of {@link fields}. */
  declare field: (fields: string | readonly FieldName<RowFromSchema<Schema>>[]) => this;

  /**
   * Replaces the selected fields.
   *
   * A string is split on commas and trimmed. An array receives schema field-name
   * checking, while strings remain available for Adapter-compatible expressions.
   *
   * @param fields - Comma-separated expression or logical field names.
   * @returns This Query.
   * @throws When the runtime value is neither a string nor an array.
   */
  fields(fields: string | readonly FieldName<RowFromSchema<Schema>>[]): this {
    let normalized: readonly unknown[] | unknown = fields;
    if (typeof fields === 'string') {
      normalized = fields.split(',').map((field) => field.trim()).filter(Boolean);
    }
    if (!isReadonlyArray(normalized)) {
      throw new Error(`query fields expected to be an array or string but got ${typeof fields} ${String(fields)}.`);
    }

    this.#fields = normalized as string[];
    return this;
  }

  /**
   * Sets the result count, or the offset and result count.
   *
   * Strings and arrays are retained for v1 compatibility. Values are parsed as
   * base-10 integers, invalid values become `0`, and at most two array entries
   * are used.
   *
   * @param limit - Count, comma-separated values, or `[offset, count]`.
   * @returns This Query.
   */
  limit(limit: number | string | readonly (number | string)[]): this;
  limit(offset: number | string, count: number | string): this;
  limit(
    first: number | string | readonly (number | string)[],
    second?: number | string,
  ): this {
    if (arguments.length >= 2) {
      this.#limit = [normalizeLimit(first), normalizeLimit(second ?? 0)];
      return this;
    }

    if (typeof first === 'number') {
      this.#limit = [first];
      return this;
    }

    const values = typeof first === 'string'
      ? first.trim() === '' ? [] : first.split(',')
      : first;
    if (!isReadonlyArray(values)) {
      throw new Error(
        `query limit expected to be an array, number or string but got ${typeof first} ${String(first)}.`,
      );
    }
    this.#limit = values.slice(0, 2).map(normalizeLimit);
    return this;
  }

  /**
   * Replaces the current sort order.
   *
   * Object forms provide schema field-name checking. String forms are parsed as
   * comma-separated Adapter-compatible order expressions.
   *
   * @param order - String, field-direction object, or an array of either form.
   * @returns This Query.
   */
  order(order: QueryOrder<RowFromSchema<Schema>>): this {
    this.#order = normalizeOrder(order);
    return this;
  }

  /** Compatibility alias of {@link order}. */
  declare orderBy: (order: QueryOrder<RowFromSchema<Schema>>) => this;

  /**
   * Selects the transaction connection used by subsequent execution.
   *
   * @param connection - Adapter-specific connection, or `null` to use the
   * Adapter's default connection behavior.
   * @returns This Query.
   */
  conn(connection: AdapterConnection<AdapterInstance> | null): this {
    this.#connection = connection;
    return this;
  }

  /**
   * Counts rows matching the current condition.
   *
   * @returns The count reported by the Adapter.
   */
  async count(): Promise<number> {
    return await this.#adapter.count(
      this.#adapterData() as AdapterCountQueryType<AdapterInstance>,
    );
  }

  /**
   * Updates rows matching the current condition.
   *
   * Availability, additional arguments, and the resolved value are determined
   * by the selected Adapter.
   *
   * @param data - Logical field values to write.
   * @param support - Adapter-defined additional arguments.
   * @returns The Adapter-defined bulk-update result.
   */
  async update(
    data: Partial<RowFromSchema<Schema>>,
    ...support: AdapterUpdateByQueryCallArguments<AdapterInstance>
  ): Promise<AdapterUpdateByQueryResult<AdapterInstance>> {
    void support;
    this.#updateData = data;
    const adapter = this.#adapter as unknown as {
      updateByQuery(query: AdapterUpdateByQueryType<AdapterInstance>): Promise<AdapterUpdateByQueryResult<AdapterInstance>>;
    };
    return await adapter.updateByQuery(
      this.#adapterData() as unknown as AdapterUpdateByQueryType<AdapterInstance>,
    );
  }

  /**
   * Deletes rows matching the current condition.
   *
   * @returns The Adapter-defined bulk-delete result.
   */
  async delete(): Promise<AdapterDeleteByQueryResult<AdapterInstance>> {
    const adapter = this.#adapter as unknown as {
      deleteByQuery(query: AdapterDeleteQueryType<AdapterInstance>): Promise<AdapterDeleteByQueryResult<AdapterInstance>>;
    };
    return await adapter.deleteByQuery(
      this.#adapterData() as unknown as AdapterDeleteQueryType<AdapterInstance>,
    );
  }

  /**
   * Executes an Adapter-specific raw operation using the connection selected by
   * {@link conn}.
   *
   * @param arguments_ - Adapter-defined execute arguments.
   * @returns The Adapter-defined execution result.
   */
  async execute(
    ...arguments_: AdapterQueryExecuteArguments<AdapterInstance>
  ): Promise<AdapterExecuteResult<AdapterInstance>> {
    const adapter = this.#adapter as unknown as {
      execute(connection: AdapterConnection<AdapterInstance> | null, ...values: AdapterQueryExecuteArguments<AdapterInstance>): Promise<AdapterExecuteResult<AdapterInstance>>;
    };
    return await adapter.execute(this.#connection, ...arguments_);
  }

  /**
   * Finds rows using the current Query state.
   *
   * By default, the result is an array of Yukari rows. Passing `true` returns
   * plain objects serialized through Field Types. `single: true` requests one
   * result and changes the return type to a row or `null`; `noCache: true`
   * tells the Adapter to bypass query caching. The boolean and options object
   * may be passed in either supported order.
   *
   * @returns Many rows by default, or one row when `single: true`.
   *
   * @example
   * ```ts
   * await User.where({ active: true }).find();
   * await User.where({ active: true }).find(true);
   * await User.where({ active: true }).find({ single: true });
   * ```
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
  async find(
    toJSONOrOptions: boolean | QueryFindOptions = false,
    maybeOptions?: boolean | QueryFindOptions,
  ): Promise<
    | readonly QueriedYukari<Name, Schema, AdapterInstance>[]
    | QueriedYukari<Name, Schema, AdapterInstance>
    | readonly QueryJsonRow<Schema>[]
    | QueryJsonRow<Schema>
    | null
  > {
    let toJSON = false;
    let options: QueryFindOptions = {};
    for (const argument of [toJSONOrOptions, maybeOptions]) {
      if (typeof argument === 'boolean') toJSON = argument;
      else if (argument !== null && typeof argument === 'object') options = argument;
    }
    const normalizedOptions = options;
    const single = Boolean(normalizedOptions.single);
    const result = await this.fetch({
      noCache: Boolean(normalizedOptions.noCache),
      single,
    });

    if (single) {
      if (!result) return result as null;
      const row = this.hydrate(result as AdapterRow);
      return toJSON ? row.toJSON() : row;
    }

    if (!result || !isReadonlyArray(result) || result.length === 0) {
      return result as unknown as readonly QueriedYukari<Name, Schema, AdapterInstance>[];
    }

    const rows = result.map((row) => this.hydrate(row));
    return toJSON ? rows.map((row) => row.toJSON()) : rows;
  }

  /**
   * Finds at most one row using the current Query state.
   *
   * @returns The first row, or `null` when no row matches.
   */
  findOne(): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  findOne(toJSON: false): Promise<QueriedYukari<Name, Schema, AdapterInstance> | null>;
  findOne(toJSON: true): Promise<QueryJsonRow<Schema> | null>;
  async findOne(
    toJSON = false,
  ): Promise<QueriedYukari<Name, Schema, AdapterInstance> | QueryJsonRow<Schema> | null> {
    const result = await this.fetch({ noCache: false, single: true });
    if (!result) return result as null;
    const row = this.hydrate(result as AdapterRow);
    return toJSON ? row.toJSON() : row;
  }

  /**
   * Finds one row by its primary-key value or values.
   *
   * A Model with one primary key accepts the value directly. Composite keys
   * require an object. With a configured Cache, this first attempts a Cache
   * read; Cache errors fall back to the Adapter.
   *
   * @param id - Primary-key value or composite-key object.
   * @returns The matching row, or `null`.
   * @throws When a primitive ID is supplied to a Model without exactly one
   * primary key.
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
  async findById(
    id: FindByIdInput<Schema>,
    toJSON = false,
  ): Promise<QueriedYukari<Name, Schema, AdapterInstance> | QueryJsonRow<Schema> | null> {
    const condition = this.primaryKeyCondition(id);
    this.where(condition);

    if (this.#cache) {
      let data: readonly (AdapterRow | null)[] = [];
      try {
        data = await this.#cache.getData<AdapterRow>(
          this.#toshihiko.database,
          this.#model.name,
          condition,
        );
      } catch {
        data = [];
      }

      if (data.length !== 0) {
        const row = this.hydrate(data[0] as AdapterRow);
        return toJSON ? row.toJSON() : row;
      }
    }

    return toJSON ? await this.findOne(true) : await this.findOne(false);
  }

  #adapterData(): QueryAdapterData<Name, Schema, AdapterInstance> {
    return {
      cache: this.#cache,
      connection: this.#connection,
      fields: [...this.#fields],
      index: this.#index,
      limit: [...this.#limit],
      model: this.#model,
      order: [...this.#order],
      updateData: { ...this.#updateData },
      where: this.#where,
    };
  }

  private async fetch(options: AdapterFindOptions): Promise<AdapterFindResult> {
    return this.#adapter.find(
      this.#adapterData() as AdapterQueryType<AdapterInstance>,
      options,
    );
  }

  private hydrate(row: AdapterRow): QueriedYukari<Name, Schema, AdapterInstance> {
    if (row instanceof Yukari) {
      return row as QueriedYukari<Name, Schema, AdapterInstance>;
    }

    const yukari = new Yukari<Name, Schema, AdapterInstance>(
      this.#model,
      'query',
      row,
      true,
    );
    return yukari as QueriedYukari<Name, Schema, AdapterInstance>;
  }

  private primaryKeyCondition(
    id: FindByIdInput<Schema>,
  ): QueryWhere<RowFromSchema<Schema>> {
    const primaryKeys = this.#model.primaryKeys;
    if (primaryKeys.length === 1 && typeof id !== 'object') {
      return {
        [primaryKeys[0]!.name]: id,
      } as QueryWhere<RowFromSchema<Schema>>;
    }

    if (typeof id !== 'object') {
      throw new Error('you should pass a valid IDs object');
    }
    return id as QueryWhere<RowFromSchema<Schema>>;
  }
}

function normalizeLimit(value: number | string | readonly (number | string)[]): number {
  if (isReadonlyArray(value)) {
    return normalizeLimit(value[0] ?? 0);
  }
  const normalized = parseInt(value as string);
  return Number.isNaN(normalized) ? 0 : normalized;
}

function normalizeOrder<Row extends object>(
  order: QueryOrder<Row>,
): Readonly<Record<string, number>>[] {
  if (typeof order === 'string') {
    return order.split(',').map(parseOrderFragment).filter(isDefined);
  }

  if (isReadonlyArray(order)) {
    return order.flatMap((entry) => typeof entry === 'string'
      ? [parseArrayOrderFragment(entry)]
      : normalizeOrderObject(entry));
  }

  return normalizeOrderObject(order);
}

function normalizeOrderObject(
  order: Readonly<Record<string, QueryOrderDirection | undefined>>,
): Readonly<Record<string, number>>[] {
  return Object.entries(order).map(([name, direction]) => ({
    [name.trim()]: normalizeOrderDirection(direction),
  }));
}

function parseOrderFragment(
  fragment: string,
): Readonly<Record<string, number>> | undefined {
  const [name, direction] = fragment.trim().split(/\s+/, 2);
  if (!name) {
    return undefined;
  }
  return { [name]: normalizeOrderDirection(direction) };
}

function parseArrayOrderFragment(
  fragment: string,
): Readonly<Record<string, number>> {
  const parts = fragment.split(' ');
  return {
    [parts[0]!.trim()]: normalizeOrderDirection(parts[1] || 'ASC'),
  };
}

function normalizeOrderDirection(
  direction: QueryOrderDirection | string | undefined,
): number {
  if (direction === undefined) {
    return 1;
  }
  if (typeof direction === 'number') {
    return direction;
  }
  return direction.toUpperCase() === 'ASC' ? 1 : -1;
}

function isDefined<Value>(value: Value | undefined): value is Value {
  return value !== undefined;
}

function isReadonlyArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}
