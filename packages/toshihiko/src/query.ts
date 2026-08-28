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
  AdapterQueryExecuteArguments,
  AdapterQueryType,
  AdapterRow,
  AdapterUpdateByQueryResult,
  AdapterUpdateByQueryCallArguments,
  AdapterUpdateByQueryType,
} from './contracts/adapter';
import type { FieldName } from './contracts/common';
import type {
  JsonRowFromSchema,
  RowFromSchema,
  SchemaDefinition,
} from './contracts/field';
import type { Model } from './contracts/model';
import { Yukari, type QueriedYukari } from './yukari';
import type { Cache } from './contracts/cache';

export type QueryOrderDirection = number | 'asc' | 'ASC' | 'desc' | 'DESC';

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
  readonly single?: boolean;
}

export interface QueryFindManyOptions extends QueryFindOptions {
  readonly single?: false;
}

export interface QueryFindOneOptions extends QueryFindOptions {
  readonly single: true;
}

export type QueryJsonRow<Schema extends SchemaDefinition> = Partial<
  JsonRowFromSchema<Schema>
>;

type PrimaryKeyName<Schema extends SchemaDefinition> = Extract<
  Schema[number],
  { readonly primaryKey: true }
>['name'];

export type FindByIdInput<Schema extends SchemaDefinition> =
  [PrimaryKeyName<Schema>] extends [never]
    ? Readonly<Record<string, unknown>>
    : RowFromSchema<Schema>[PrimaryKeyName<Schema>]
      | Readonly<Record<string, unknown>>;

export class Query<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike = Adapter,
> {
  declare readonly adapter: AdapterInstance;
  declare readonly cache: Cache | null;
  declare readonly model: Model<Name, Schema, AdapterInstance>;
  declare readonly toshihiko: Model<Name, Schema, AdapterInstance>['parent'];

  _conn: AdapterConnection<AdapterInstance> | null = null;
  _fields: string[];
  _index = '';
  _limit: number[] = [];
  _order: Readonly<Record<string, number>>[] = [];
  _updateData: Partial<RowFromSchema<Schema>> = {};
  _where: QueryWhere<RowFromSchema<Schema>> = {};

  constructor(model: Model<Name, Schema, AdapterInstance>) {
    Object.defineProperties(this, {
      adapter: { value: model.parent.adapter },
      cache: { value: model.cache },
      field: { value: this.fields, writable: true },
      model: { value: model },
      orderBy: { value: this.order, writable: true },
      toshihiko: { value: model.parent },
    });
    this._fields = model.schema.map((field) => field.name);
  }

  index(indexName: string): this {
    this._index = indexName;
    return this;
  }

  where(condition: QueryWhere<RowFromSchema<Schema>>): this {
    if (typeof condition !== 'object') {
      throw new Error(`query condition expected to be an object but got ${typeof condition} ${String(condition)}.`);
    }

    this._where = condition;
    return this;
  }

  declare field: (fields: string | readonly FieldName<RowFromSchema<Schema>>[]) => this;

  fields(fields: string | readonly FieldName<RowFromSchema<Schema>>[]): this {
    let normalized: readonly unknown[] | unknown = fields;
    if (typeof fields === 'string') {
      normalized = fields.split(',').map((field) => field.trim()).filter(Boolean);
    }
    if (!isReadonlyArray(normalized)) {
      throw new Error(`query fields expected to be an array or string but got ${typeof fields} ${String(fields)}.`);
    }

    this._fields = normalized as string[];
    return this;
  }

  limit(limit: number | string | readonly (number | string)[]): this;
  limit(offset: number | string, count: number | string): this;
  limit(
    first: number | string | readonly (number | string)[],
    second?: number | string,
  ): this {
    if (arguments.length >= 2) {
      this._limit = [normalizeLimit(first), normalizeLimit(second ?? 0)];
      return this;
    }

    if (typeof first === 'number') {
      this._limit = [first];
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
    this._limit = values.slice(0, 2).map(normalizeLimit);
    return this;
  }

  order(order: QueryOrder<RowFromSchema<Schema>>): this {
    this._order = normalizeOrder(order);
    return this;
  }

  declare orderBy: (order: QueryOrder<RowFromSchema<Schema>>) => this;

  conn(connection: AdapterConnection<AdapterInstance> | null): this {
    this._conn = connection;
    return this;
  }

  async count(): Promise<number> {
    return await this.adapter.count(
      this as AdapterCountQueryType<AdapterInstance>,
    );
  }

  async update(
    data: Partial<RowFromSchema<Schema>>,
    ..._support: AdapterUpdateByQueryCallArguments<AdapterInstance>
  ): Promise<AdapterUpdateByQueryResult<AdapterInstance>> {
    void _support;
    this._updateData = data;
    const adapter = this.adapter as unknown as {
      updateByQuery(query: AdapterUpdateByQueryType<AdapterInstance>): Promise<AdapterUpdateByQueryResult<AdapterInstance>>;
    };
    return await adapter.updateByQuery(
      this as unknown as AdapterUpdateByQueryType<AdapterInstance>,
    );
  }

  async delete(): Promise<AdapterDeleteByQueryResult<AdapterInstance>> {
    const adapter = this.adapter as unknown as {
      deleteByQuery(query: AdapterDeleteQueryType<AdapterInstance>): Promise<AdapterDeleteByQueryResult<AdapterInstance>>;
    };
    return await adapter.deleteByQuery(
      this as unknown as AdapterDeleteQueryType<AdapterInstance>,
    );
  }

  async execute(
    ...arguments_: AdapterQueryExecuteArguments<AdapterInstance>
  ): Promise<AdapterExecuteResult<AdapterInstance>> {
    const adapter = this.adapter as unknown as {
      execute(connection: AdapterConnection<AdapterInstance> | null, ...values: AdapterQueryExecuteArguments<AdapterInstance>): Promise<AdapterExecuteResult<AdapterInstance>>;
    };
    return await adapter.execute(this._conn, ...arguments_);
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

    if (this.cache) {
      let data: readonly (AdapterRow | null)[] = [];
      try {
        data = await this.cache.getData<AdapterRow>(
          this.toshihiko.database,
          this.model.name,
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

  private async fetch(options: AdapterFindOptions): Promise<AdapterFindResult> {
    return this.adapter.find(
      this as AdapterQueryType<AdapterInstance>,
      options,
    );
  }

  private hydrate(row: AdapterRow): QueriedYukari<Name, Schema, AdapterInstance> {
    if (row instanceof Yukari) {
      return row as QueriedYukari<Name, Schema, AdapterInstance>;
    }

    const yukari = new Yukari<Name, Schema, AdapterInstance>(this.model, 'query');
    yukari.fillRowFromSource(row as Readonly<Record<string, unknown>>, true);
    return yukari as QueriedYukari<Name, Schema, AdapterInstance>;
  }

  private primaryKeyCondition(
    id: FindByIdInput<Schema>,
  ): QueryWhere<RowFromSchema<Schema>> {
    const primaryKeys = this.model.primaryKeys;
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
