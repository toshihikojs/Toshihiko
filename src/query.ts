import type {
  Adapter,
  AdapterFindOptions,
  AdapterFindResult,
  AdapterRow,
} from './contracts/adapter';
import type { FieldName } from './contracts/common';
import type {
  JsonRowFromSchema,
  RowFromSchema,
  SchemaDefinition,
} from './contracts/field';
import type { Model } from './contracts/model';
import { Yukari, type QueriedYukari } from './yukari';

export type QueryOrderDirection = 1 | -1 | 'asc' | 'ASC' | 'desc' | 'DESC';

export interface QueryFieldOperators<Value> {
  readonly $and?: Value | readonly Value[];
  readonly $between?: readonly [Value, Value];
  readonly $eq?: Value;
  readonly $gt?: Value;
  readonly $gte?: Value;
  readonly $in?: readonly Value[];
  readonly $like?: Value;
  readonly $lt?: Value;
  readonly $lte?: Value;
  readonly $neq?: Value;
  readonly $or?: Value | readonly Value[];
  readonly '<'?: Value;
  readonly '<='?: Value;
  readonly '==='?: Value;
  readonly '>'?: Value;
  readonly '>='?: Value;
  readonly '!=='?: Value;
}

export type QueryFieldCondition<Value> = Value | QueryFieldOperators<Value>;

export type QueryWhere<Row extends object> = {
  readonly [Name in keyof Row]?: QueryFieldCondition<Row[Name]>;
} & {
  readonly $and?: QueryWhere<Row> | readonly QueryWhere<Row>[];
  readonly $or?: QueryWhere<Row> | readonly QueryWhere<Row>[];
};

export type QueryOrder<Row extends object> =
  | string
  | Readonly<Partial<Record<FieldName<Row>, QueryOrderDirection>>>
  | readonly (
    | string
    | Readonly<Partial<Record<FieldName<Row>, QueryOrderDirection>>>
  )[];

export interface QueryFindOptions {
  readonly noCache?: boolean;
}

export type QueryJsonRow<Schema extends SchemaDefinition> = Partial<
  JsonRowFromSchema<Schema>
>;

type PrimaryKeyName<Schema extends SchemaDefinition> = Extract<
  Schema[number],
  { readonly primaryKey: true }
>['name'];

type IsUnion<Value, Whole = Value> = Value extends unknown
  ? [Whole] extends [Value] ? false : true
  : never;

export type FindByIdInput<Schema extends SchemaDefinition> =
  [PrimaryKeyName<Schema>] extends [never]
    ? never
    : true extends IsUnion<PrimaryKeyName<Schema>>
      ? Pick<RowFromSchema<Schema>, PrimaryKeyName<Schema>>
      : RowFromSchema<Schema>[PrimaryKeyName<Schema>]
        | Pick<RowFromSchema<Schema>, PrimaryKeyName<Schema>>;

export class Query<
  Name extends string,
  Schema extends SchemaDefinition,
> {
  readonly cache = null;
  readonly model: Model<Name, Schema>;
  readonly toshihiko: Model<Name, Schema>['parent'];

  _conn: unknown = null;
  _fields: string[];
  _index = '';
  _limit: number[] = [];
  _order: Readonly<Record<string, 1 | -1>>[] = [];
  _updateData: Partial<RowFromSchema<Schema>> = {};
  _where: QueryWhere<RowFromSchema<Schema>> = {};

  constructor(model: Model<Name, Schema>) {
    this.model = model;
    this.toshihiko = model.parent;
    this._fields = model.schema.map((field) => field.name);
  }

  get adapter(): Adapter {
    return this.toshihiko.getAdapter();
  }

  index(indexName: string): this {
    this._index = indexName;
    return this;
  }

  where(condition: QueryWhere<RowFromSchema<Schema>>): this {
    if (condition === null || typeof condition !== 'object' || Array.isArray(condition)) {
      throw new TypeError('query condition must be an object.');
    }

    this._where = condition;
    return this;
  }

  field(fields: string | readonly FieldName<RowFromSchema<Schema>>[]): this {
    return this.fields(fields);
  }

  fields(fields: string | readonly FieldName<RowFromSchema<Schema>>[]): this {
    const normalized = typeof fields === 'string'
      ? fields.split(',').map((field) => field.trim()).filter(Boolean)
      : [...fields];

    this._fields = normalized;
    return this;
  }

  limit(limit: number | string | readonly (number | string)[]): this;
  limit(offset: number | string, count: number | string): this;
  limit(
    first: number | string | readonly (number | string)[],
    second?: number | string,
  ): this {
    if (second !== undefined) {
      this._limit = [normalizeLimit(first), normalizeLimit(second)];
      return this;
    }

    if (typeof first === 'number') {
      this._limit = [first];
      return this;
    }

    const values = typeof first === 'string'
      ? first.trim() === '' ? [] : first.split(',')
      : first;
    this._limit = values.slice(0, 2).map(normalizeLimit);
    return this;
  }

  order(order: QueryOrder<RowFromSchema<Schema>>): this {
    this._order = normalizeOrder(order);
    return this;
  }

  orderBy(order: QueryOrder<RowFromSchema<Schema>>): this {
    return this.order(order);
  }

  conn(connection: unknown): this {
    this._conn = connection;
    return this;
  }

  find(): Promise<readonly QueriedYukari<Name, Schema>[]>;
  find(
    toJSON: false,
    options?: QueryFindOptions,
  ): Promise<readonly QueriedYukari<Name, Schema>[]>;
  find(
    toJSON: true,
    options?: QueryFindOptions,
  ): Promise<readonly QueryJsonRow<Schema>[]>;
  async find(
    toJSON = false,
    options: QueryFindOptions = {},
  ): Promise<readonly QueriedYukari<Name, Schema>[] | readonly QueryJsonRow<Schema>[]> {
    const result = await this.fetch({
      noCache: options.noCache ?? false,
      single: false,
    });

    if (!isReadonlyArray(result)) {
      throw new TypeError('Adapter.find() must return an array for a list query.');
    }

    const rows = result.map((row) => this.hydrate(row));
    return toJSON ? rows.map((row) => row.toJSON()) : rows;
  }

  findOne(): Promise<QueriedYukari<Name, Schema> | null>;
  findOne(toJSON: false): Promise<QueriedYukari<Name, Schema> | null>;
  findOne(toJSON: true): Promise<QueryJsonRow<Schema> | null>;
  async findOne(
    toJSON = false,
  ): Promise<QueriedYukari<Name, Schema> | QueryJsonRow<Schema> | null> {
    const result = await this.fetch({ noCache: false, single: true });
    if (result === null) {
      return null;
    }
    if (isReadonlyArray(result)) {
      throw new TypeError('Adapter.find() must return one row or null for a single query.');
    }

    const row = this.hydrate(result);
    return toJSON ? row.toJSON() : row;
  }

  findById(
    id: FindByIdInput<Schema>,
  ): Promise<QueriedYukari<Name, Schema> | null>;
  findById(
    id: FindByIdInput<Schema>,
    toJSON: false,
  ): Promise<QueriedYukari<Name, Schema> | null>;
  findById(
    id: FindByIdInput<Schema>,
    toJSON: true,
  ): Promise<QueryJsonRow<Schema> | null>;
  async findById(
    id: FindByIdInput<Schema>,
    toJSON = false,
  ): Promise<QueriedYukari<Name, Schema> | QueryJsonRow<Schema> | null> {
    const condition = this.primaryKeyCondition(id);
    this.where(condition);
    return toJSON ? await this.findOne(true) : await this.findOne(false);
  }

  private async fetch(options: AdapterFindOptions): Promise<AdapterFindResult> {
    const adapter = this.adapter;
    if (adapter.find.length >= 3) {
      throw new TypeError('callback Adapters are not supported in Toshihiko v2.');
    }

    const pending = adapter.find(this, options);
    if (!isPromiseLike(pending)) {
      throw new TypeError('Adapter.find() must return a Promise.');
    }

    return pending;
  }

  private hydrate(row: AdapterRow): QueriedYukari<Name, Schema> {
    if (row instanceof Yukari) {
      return row as QueriedYukari<Name, Schema>;
    }

    if (row === null || typeof row !== 'object' || Array.isArray(row)) {
      throw new TypeError('Adapter.find() returned an invalid row.');
    }

    const yukari = new Yukari(this.model, 'query');
    yukari.fillRowFromSource(row, true);
    return yukari as QueriedYukari<Name, Schema>;
  }

  private primaryKeyCondition(
    id: FindByIdInput<Schema>,
  ): QueryWhere<RowFromSchema<Schema>> {
    const primaryKeys = this.model.primaryKeys;
    if (primaryKeys.length === 0) {
      throw new Error(`Model ${this.model.name} has no primary key.`);
    }

    if (primaryKeys.length === 1 && (id === null || typeof id !== 'object')) {
      return {
        [primaryKeys[0]!.name]: id,
      } as QueryWhere<RowFromSchema<Schema>>;
    }

    if (id === null || typeof id !== 'object' || Array.isArray(id)) {
      throw new TypeError('findById() requires an object for composite primary keys.');
    }

    const values = id as Readonly<Record<string, unknown>>;
    const condition: Record<string, unknown> = {};
    for (const primaryKey of primaryKeys) {
      if (!Object.prototype.hasOwnProperty.call(values, primaryKey.name)) {
        throw new TypeError(`findById() is missing primary key ${primaryKey.name}.`);
      }
      condition[primaryKey.name] = values[primaryKey.name];
    }

    return condition as QueryWhere<RowFromSchema<Schema>>;
  }
}

function normalizeLimit(value: number | string | readonly (number | string)[]): number {
  if (isReadonlyArray(value)) {
    return normalizeLimit(value[0] ?? 0);
  }
  const normalized = Number.parseInt(String(value), 10);
  return Number.isNaN(normalized) ? 0 : normalized;
}

function normalizeOrder<Row extends object>(
  order: QueryOrder<Row>,
): Readonly<Record<string, 1 | -1>>[] {
  if (typeof order === 'string') {
    return order.split(',').map(parseOrderFragment).filter(isDefined);
  }

  if (isReadonlyArray(order)) {
    return order.flatMap((entry) => typeof entry === 'string'
      ? [parseOrderFragment(entry)].filter(isDefined)
      : normalizeOrderObject(entry));
  }

  if (order === null || typeof order !== 'object') {
    throw new TypeError('query order must be a string, object, or array.');
  }
  return normalizeOrderObject(order);
}

function normalizeOrderObject(
  order: Readonly<Record<string, QueryOrderDirection | undefined>>,
): Readonly<Record<string, 1 | -1>>[] {
  return Object.entries(order).map(([name, direction]) => ({
    [name.trim()]: normalizeOrderDirection(direction),
  }));
}

function parseOrderFragment(
  fragment: string,
): Readonly<Record<string, 1 | -1>> | undefined {
  const [name, direction] = fragment.trim().split(/\s+/, 2);
  if (!name) {
    return undefined;
  }
  return { [name]: normalizeOrderDirection(direction) };
}

function normalizeOrderDirection(
  direction: QueryOrderDirection | string | undefined,
): 1 | -1 {
  if (direction === undefined) {
    return 1;
  }
  if (typeof direction === 'number') {
    return direction === 1 ? 1 : -1;
  }
  return direction.toUpperCase() === 'ASC' ? 1 : -1;
}

function isDefined<Value>(value: Value | undefined): value is Value {
  return value !== undefined;
}

function isReadonlyArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function isPromiseLike<Value>(value: unknown): value is PromiseLike<Value> {
  return typeof value === 'object'
    && value !== null
    && 'then' in value
    && typeof value.then === 'function';
}
