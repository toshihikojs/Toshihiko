import {
  Adapter,
  extend,
  type AdapterData,
  type AdapterFindOptions,
  type AdapterRow,
} from '@toshihiko/base-adapter';
import type {
  adapterExecuteSpec,
  AdapterExecuteSpec,
} from 'toshihiko';
import { createPool } from 'mysql2/promise';
import type {
  Pool,
  PoolConnection,
  PoolOptions,
  ExecuteValues,
  QueryValues,
  QueryResult,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise';
import type {
  MySQLAdapterOptions,
  MySQLExecuteArguments,
  MySQLField,
  MySQLModel,
  MySQLQuery,
  MySQLQueryExecuteArguments,
  MySQLQueryOptions,
  MySQLStatement,
  MySQLValues,
} from './contracts';
import { MySQLSqlBuilder } from './sql-builder';

const defaultFindOptions: AdapterFindOptions = Object.freeze({
  noCache: false,
  single: false,
});

interface MySQLReadbackQuery {
  conn(connection: PoolConnection): MySQLReadbackQuery;
  findOne(): Promise<object | null>;
}

interface MySQLReadbackModel extends MySQLModel {
  where(condition: Readonly<Record<string, unknown>>): MySQLReadbackQuery;
}

export class MySQLAdapter extends Adapter<
  MySQLAdapterOptions,
  MySQLModel,
  PoolConnection,
  MySQLField,
  unknown,
  MySQLQuery
> {
  declare readonly [adapterExecuteSpec]: AdapterExecuteSpec<
    MySQLExecuteArguments,
    MySQLQueryExecuteArguments,
    QueryResult
  >;
  readonly database: string;
  declare readonly mysql: Pool;
  readonly package = 'mysql2';
  readonly username: string;

  declare private readonly builder: MySQLSqlBuilder;
  declare private readonly showSql: ((sql: string) => void) | null;

  constructor(options?: MySQLAdapterOptions);
  constructor(parent: object, options: MySQLAdapterOptions);
  constructor(
    parentOrOptions?: object,
    adapterOptions?: MySQLAdapterOptions,
  ) {
    const hasParent = arguments.length >= 2;
    const parent = hasParent ? parentOrOptions : undefined;
    const options = (hasParent ? adapterOptions : parentOrOptions) as MySQLAdapterOptions | undefined ?? {};
    super(parent ?? sanitizePublicOptions(options), hasParent ? sanitizePublicOptions(options) : undefined);
    const normalized = normalizeOptions(options);
    this.database = normalized.database;
    this.username = normalized.user;
    const showSql = normalizeShowSql(options.showSql);
    const mysql = options.pool ?? createPool(normalized.pool);
    Object.defineProperties(this, {
      builder: { value: new MySQLSqlBuilder() },
      format: {
        enumerable: true,
        value: mysql.format.bind(mysql),
      },
      mysql: { value: mysql },
      showSql: { value: showSql },
    });
    if (options.showSql === true) {
      (this.options as { showSql?: MySQLAdapterOptions['showSql'] }).showSql = showSql ?? undefined;
    }
    this.mysql.on('connection', () => {
      this.emit('log', 'A new MySQL connection from Toshihiko is set. ⁽⁽ଘ( ˙꒳˙ )ଓ⁾⁾');
    });
  }

  override getDBName(): string {
    return this.database;
  }

  override async find(
    query: MySQLQuery,
    options: AdapterFindOptions = defaultFindOptions,
  ): Promise<AdapterRow | readonly AdapterRow[] | null> {
    const normalized = this.queryToOptions(query, options);
    return !query.cache || options.noCache
      ? this.findWithNoCache(query.model, normalized)
      : this.findWithCache(query.cache, query.model, normalized);
  }

  override async count(query: MySQLQuery): Promise<number> {
    const options = this.queryToOptions(query);
    const compiled = this.builder.compileSql('count', query.model, options);
    const result = await this.execute(
      options.conn ?? null,
      compiled.sql,
      compiled.values,
    );
    const rows = result as readonly AdapterRow[] | null | undefined;
    const first = (rows || [{ 'COUNT(0)': 0 }])[0];
    return first!['COUNT(0)'] as number;
  }

  override async updateByQuery(query: MySQLQuery): Promise<ResultSetHeader> {
    const options = this.queryToOptions(query);
    const compiled = this.builder.compileSql('update', query.model, options);
    await this.invalidateQueryCache(query, options);
    return await this.execute(
      options.conn ?? null,
      compiled.sql,
      compiled.values,
    ) as ResultSetHeader;
  }

  override async deleteByQuery(query: MySQLQuery): Promise<ResultSetHeader> {
    const options = this.queryToOptions(query);
    const compiled = this.builder.compileSql('delete', query.model, options);
    await this.invalidateQueryCache(query, options);
    return await this.execute(
      options.conn ?? null,
      compiled.sql,
      compiled.values,
    ) as ResultSetHeader;
  }

  override async insert(
    model: MySQLModel,
    connection: PoolConnection | null,
    data: readonly AdapterData<MySQLField, unknown>[],
  ): Promise<AdapterRow> {
    const primaryValues: Record<string, unknown> = {};
    const assignments: MySQLStatement[] = data.map((entry) => {
      if (entry.field.primaryKey || model.primaryKeys.length === 0) {
        primaryValues[entry.field.name] = entry.value;
      }
      const compiled = this.builder.compileValue(entry.field, entry.value);
      return {
        sql: `${quoteIdentifier(entry.field.column)} = ${compiled.sql}`,
        values: compiled.values,
      };
    });
    const insertSet = joinStatements(assignments, ', ');
    const sql = `INSERT INTO ${quoteIdentifier(model.name)} SET ${insertSet.sql}`;
    const mutation = await this.execute(connection, sql, insertSet.values) as ResultSetHeader;
    if (!mutation) throw new Error('no row inserted.');

    const where = resolveInsertedRowWhere(model, primaryValues, mutation.insertId);
    if (model.primaryKeys.length === 0 && mutation.insertId) {
      console.error('[TOSHIHIKO WARNING] no primary key while inserting may cause some problems!');
    }
    let query = (model as MySQLReadbackModel).where(where);
    if (connection) {
      query = query.conn(connection);
    }
    const row = await query.findOne();
    if (!row) {
      throw new Error('insert successfully but failed to read the record.');
    }
    return row as AdapterRow;
  }

  override async update(
    model: MySQLModel,
    connection: PoolConnection | null,
    primaryKey: Readonly<Record<string, unknown>>,
    data: readonly AdapterData<MySQLField, unknown>[],
  ): Promise<ResultSetHeader> {
    if (!primaryKey || !data) {
      throw new Error('Invalid parameters.');
    }
    if (Object.keys(primaryKey).length === 0) {
      throw new Error('Broken yukari object.');
    }
    if (data.length === 0) {
      throw new Error('Broken update data information.');
    }

    const updateData: Record<string, unknown> = {};
    for (const entry of data) {
      updateData[entry.field.name] = entry.value;
    }
    const compiled = this.builder.compileUpdate(model, {
      update: updateData,
      where: primaryKey,
    });
    if (model.cache) {
      const primaryKeyNames = model.primaryKeys.map((field) => field.name);
      const relatedRows = await this.findWithNoCache(model, {
        conn: connection,
        fields: primaryKeyNames,
        limit: [0, 1],
        where: { ...primaryKey },
      });
      await model.cache.deleteKeys(
        this.getDBName(),
        model.name,
        Array.isArray(relatedRows) ? relatedRows : relatedRows ? [relatedRows] : [],
      );
    }
    const mutation = await this.execute(
      connection,
      compiled.sql,
      compiled.values,
    ) as ResultSetHeader;
    if (!mutation.affectedRows) {
      throw new Error('Out-dated yukari data.');
    }
    return mutation;
  }

  override async execute(
    ...arguments_: MySQLExecuteArguments
  ): Promise<QueryResult> {
    const parsed = parseExecuteArguments(arguments_);
    const sqlForLog = this.format(parsed.sql, parsed.values);
    this.showSql?.(sqlForLog);

    const target = parsed.connection ?? this.mysql;
    const [result] = parsed.values === undefined
      || !Array.isArray(parsed.values)
      || parsed.sql.includes('??')
      ? await target.query<QueryResult>(
        parsed.sql,
        parsed.values === undefined
          ? undefined
          : normalizeDriverValues(parsed.values),
      )
      : await target.execute<QueryResult>(
        parsed.sql,
        normalizeExecuteValues(parsed.values),
      );
    return result;
  }

  override async beginTransaction(): Promise<PoolConnection> {
    const connection = await this.mysql.getConnection();
    try {
      await connection.beginTransaction();
      return connection;
    } catch (error) {
      connection.release();
      throw error;
    }
  }

  override async commit(connection: PoolConnection): Promise<void> {
    await connection.commit();
    connection.release();
  }

  override async rollback(connection: PoolConnection): Promise<void> {
    await connection.rollback();
    connection.release();
  }

  format(sql: string, values?: MySQLValues): string {
    return values === undefined
      ? sql
      : this.mysql.format(sql, normalizeDriverValues(values));
  }

  async findWithNoCache(
    model: MySQLModel,
    options: MySQLQueryOptions = {},
  ): Promise<AdapterRow | readonly AdapterRow[] | null> {
    const compiled = this.builder.compileSql('find', model, options);
    const rows = (await this.execute(
      options.conn ?? null,
      compiled.sql,
      compiled.values,
    ) || []) as readonly AdapterRow[];
    return options.single ? rows[0] ?? null : rows;
  }

  async findWithCache(
    cache: NonNullable<MySQLModel['cache']>,
    model: MySQLModel,
    options: MySQLQueryOptions = {},
  ): Promise<AdapterRow | readonly AdapterRow[] | null> {
    const primaryKeys = model.primaryKeys.map((field) => field.name);
    const totalFields = model.schema.map((field) => field.name);
    const originalFields = unique([...(options.fields ?? totalFields), ...primaryKeys]);

    options.fields = primaryKeys;
    let primaryRows: readonly AdapterRow[];
    try {
      primaryRows = await this.findWithNoCache(model, {
        ...options,
        single: false,
      }) as readonly AdapterRow[];
    } catch (error) {
      options.fields = originalFields;
      throw error;
    }

    let cachedRows: readonly (AdapterRow | null)[] = [];
    try {
      cachedRows = await cache.getData<AdapterRow>(this.database, model.name, primaryRows);
    } catch {
      cachedRows = [];
    }

    const result: (AdapterRow | undefined)[] = [];
    const missing: number[] = [];
    for (let index = 0; index < primaryRows.length; index++) {
      const primaryRow = primaryRows[index]!;
      const cached = cachedRows.find((value) => {
        if (value === null) return false;
        const row = value;
        return Object.keys(primaryRow).every((key) => primaryRow[key] === row[key]);
      });

      if (cached !== undefined && cached !== null) {
        (cached as Record<string, unknown>).$fromCache = true;
        result.push(cached);
      } else {
        result.push(undefined);
        missing.push(index);
      }
    }

    const errors: unknown[] = [];
    await runWithConcurrency(missing, 10, async (index) => {
      const primaryRow = primaryRows[index]!;
      let row: AdapterRow | null | undefined;
      try {
        const rows = await this.findWithNoCache(model, {
          conn: options.conn ?? null,
          fields: totalFields,
          limit: [0, 1],
          where: model.convertColumnToName(primaryRow),
        });
        row = Array.isArray(rows) ? rows[0] : rows;
      } catch (error) {
        errors.push(error);
        return;
      }
      if (!row) return;
      try {
        await cache.setData(this.database, model.name, primaryRow, row);
      } catch {
        // Cache writes do not change successful database reads in v1.
      }
      result[index] = row;
    });
    const deletedColumns = model.schema
      .filter((field) => !originalFields.includes(field.name))
      .map((field) => field.column);
    const liteResult = result.filter(Boolean).map((row) => {
      const mutable = row as Record<string, unknown>;
      for (const column of deletedColumns) delete mutable[column];
      return row!;
    });

    options.fields = originalFields;
    if (errors.length > 0) throw errors[0];
    return options.single ? liteResult[0] ?? null : liteResult;
  }

  private async invalidateQueryCache(
    query: MySQLQuery,
    options: MySQLQueryOptions,
  ): Promise<void> {
    const cache = query.model.cache;
    if (!cache) return;

    const originalFields = options.fields;
    options.fields = query.model.primaryKeys.map((field) => field.name);
    const relatedRows = await this.findWithNoCache(query.model, options);
    try {
      await cache.deleteKeys(
        this.getDBName(),
        query.model.name,
        Array.isArray(relatedRows) ? relatedRows : relatedRows ? [relatedRows] : [],
      );
    } finally {
      if (originalFields === undefined) delete options.fields;
      else options.fields = originalFields;
    }
  }

  queryToOptions(
    query: MySQLQuery,
    overrides: Partial<MySQLQueryOptions> = {},
  ): MySQLQueryOptions {
    const options = extend({
      fields: query._fields,
      index: query._index,
      limit: query._limit,
      order: query._order,
      update: query._updateData,
      where: query._where,
    }, overrides) as MySQLQueryOptions;
    options.conn = query._conn;

    if (!options.single) {
      return options;
    }
    const limit = [...(options.limit ?? [])];
    if (limit.length === 0) {
      limit.push(0, 1);
    } else if (limit.length === 1) {
      limit[0] = 1;
    } else {
      limit[1] = 1;
    }
    return { ...options, limit };
  }

  makeFieldWhere(
    model: MySQLModel,
    key: string,
    condition: unknown,
    logic?: string,
  ): string {
    return this.builder.makeFieldWhere(model, key, condition, logic);
  }

  makeArrayWhere(
    model: MySQLModel,
    condition: readonly Readonly<Record<string, unknown>>[],
    logic?: string,
  ): string {
    return this.builder.makeArrayWhere(model, condition, logic);
  }

  makeWhere(
    model: MySQLModel,
    condition: Readonly<Record<string, unknown>> | readonly Readonly<Record<string, unknown>>[],
    logic?: string,
  ): string {
    return this.builder.makeWhere(model, condition, logic);
  }

  makeOrder(
    model: MySQLModel,
    order: readonly Readonly<Record<string, number>>[],
  ): string {
    return this.builder.makeOrder(model, order);
  }

  makeLimit(
    model: MySQLModel,
    limit: readonly (number | string)[],
  ): string {
    return this.builder.makeLimit(model, limit);
  }

  makeIndex(model: MySQLModel, index?: string): string {
    return this.builder.makeIndex(model, index);
  }

  makeSet(model: MySQLModel, update: Readonly<Record<string, unknown>>): string {
    return this.builder.makeSet(model, update);
  }

  makeFind(model: MySQLModel, options?: MySQLQueryOptions): string {
    return this.builder.makeFind(model, options);
  }

  makeUpdate(model: MySQLModel, options?: MySQLQueryOptions): string {
    return this.builder.makeUpdate(model, options);
  }

  makeDelete(model: MySQLModel, options?: MySQLQueryOptions): string {
    return this.builder.makeDelete(model, options);
  }

  makeSql(
    type: string,
    model: MySQLModel,
    options?: MySQLQueryOptions,
  ): string {
    if (type === 'count') {
      options!.count = true;
    }
    switch (type) {
      case 'count':
        return this.makeFind(model, options);
      case 'delete':
        return this.makeDelete(model, options);
      case 'update':
        return this.makeUpdate(model, options);
      default:
        return this.makeFind(model, options);
    }
  }
}

interface ResolvedOptions {
  readonly database: string;
  readonly pool: PoolOptions;
  readonly user: string;
}

function normalizeOptions(options: MySQLAdapterOptions): ResolvedOptions {
  const {
    database = 'toshihiko',
    host = 'localhost',
    password = '',
    package: _package,
    pool: _pool,
    port = 3306,
    showSql: _showSql,
    user,
    username,
    ...poolOptions
  } = options;
  const resolvedUser = username ?? user ?? '';
  return {
    database,
    user: resolvedUser,
    pool: {
      ...poolOptions,
      database,
      host,
      password,
      port,
      user: resolvedUser,
    },
  };
}

function sanitizePublicOptions(
  options: MySQLAdapterOptions,
): MySQLAdapterOptions {
  const {
    database: _database,
    host = 'localhost',
    password: _password,
    pool: _pool,
    port = 3306,
    user: _user,
    username: _username,
    ...publicOptions
  } = options;
  return { ...publicOptions, host, port };
}

function normalizeShowSql(
  showSql: MySQLAdapterOptions['showSql'],
): ((sql: string) => void) | null {
  if (showSql === true) {
    return (sql) => console.log(sql);
  }
  return typeof showSql === 'function' ? showSql : null;
}

function parseExecuteArguments(arguments_: MySQLExecuteArguments): {
  readonly connection: PoolConnection | null;
  readonly sql: string;
  readonly values?: MySQLValues;
} {
  const entries: readonly unknown[] = arguments_;
  const first = entries[0];
  if (typeof first === 'string') {
    const values = entries[1] as MySQLValues | undefined;
    return values === undefined
      ? { connection: null, sql: first }
      : { connection: null, sql: first, values };
  }

  const sql = entries[1] as string;
  const connection = first as PoolConnection | null;
  const values = entries[2] as MySQLValues | undefined;
  return values === undefined
    ? { connection, sql }
    : { connection, sql, values };
}

function normalizeDriverValues(
  values: MySQLValues,
): QueryValues {
  const normalized = Array.isArray(values)
    ? [...values]
    : { ...values };
  return normalized as QueryValues;
}

function normalizeExecuteValues(
  values: MySQLValues,
): ExecuteValues {
  const normalized = Array.isArray(values)
    ? [...values]
    : { ...values };
  return normalized as ExecuteValues;
}

function resolveInsertedRowWhere(
  model: MySQLModel,
  primaryValues: Readonly<Record<string, unknown>>,
  insertId: number,
): Readonly<Record<string, unknown>> {
  const primaryKeys = model.primaryKeys;
  const autoIncrement = model.autoIncrementField ?? model.ai;
  if (insertId) {
    if (primaryKeys.length === 1) {
      const primaryKey = primaryKeys[0]!;
      return autoIncrement === null || autoIncrement.primaryKey
        ? { [primaryKey.name]: insertId }
        : { ...primaryValues };
    }
    if (primaryKeys.length > 1) {
      return autoIncrement?.primaryKey
        ? { ...primaryValues, [autoIncrement.name]: insertId }
        : { ...primaryValues };
    }
    return autoIncrement === null
      ? { ...primaryValues }
      : { ...primaryValues, [autoIncrement.name]: insertId };
  }
  return { ...primaryValues };
}

function quoteIdentifier(identifier: string): string {
  return `\`${identifier}\``;
}

function joinStatements(
  statements: readonly MySQLStatement[],
  separator: string,
): MySQLStatement {
  return {
    sql: statements.map((statement) => statement.sql).join(separator),
    values: statements.flatMap((statement) => statement.values),
  };
}

function unique<Value>(values: readonly Value[]): Value[] {
  return [...new Set(values)];
}

async function runWithConcurrency<Value>(
  values: readonly Value[],
  concurrency: number,
  worker: (value: Value) => Promise<void>,
): Promise<void> {
  let index = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, values.length) },
    async () => {
      while (index < values.length) {
        const value = values[index++]!;
        await worker(value);
      }
    },
  );
  await Promise.all(workers);
}

export { MySQLSqlBuilder } from './sql-builder';
export type {
  MySQLAdapterOptions,
  MySQLConnection,
  MySQLExecuteArguments,
  MySQLField,
  MySQLModel,
  MySQLMutationResult,
  MySQLPool,
  MySQLQuery,
  MySQLQueryOptions,
  MySQLQueryResult,
  MySQLShowSql,
  MySQLStatement,
  MySQLValues,
} from './contracts';

export default MySQLAdapter;
