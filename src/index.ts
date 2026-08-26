import {
  Adapter,
  type AdapterData,
  type AdapterFindOptions,
  type AdapterRow,
} from '@toshihiko/base-adapter';
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
  MySQLQueryOptions,
  MySQLStatement,
  MySQLValues,
} from './contracts';
import { MySQLSqlBuilder } from './sql-builder';

const defaultFindOptions: AdapterFindOptions = Object.freeze({
  noCache: false,
  single: false,
});

export class MySQLAdapter extends Adapter<MySQLAdapterOptions> {
  readonly database: string;
  readonly mysql: Pool;
  readonly username: string;

  private readonly builder = new MySQLSqlBuilder();
  private readonly showSql: ((sql: string) => void) | null;

  constructor(options: MySQLAdapterOptions = {}) {
    super(sanitizePublicOptions(options));
    const normalized = normalizeOptions(options);
    this.database = normalized.database;
    this.username = normalized.user;
    this.showSql = normalizeShowSql(options.showSql);
    this.mysql = options.pool ?? createPool(normalized.pool);
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
    return this.findWithNoCache(
      query.model,
      this.queryToOptions(query, options),
    );
  }

  override async count(query: MySQLQuery): Promise<number> {
    const options = this.queryToOptions(query);
    const compiled = this.builder.compileSql('count', query.model, options);
    const result = await this.execute(
      options.connection ?? null,
      compiled.sql,
      compiled.values,
    );
    const rows = assertRows(result, 'count');
    const first = rows[0];
    if (first === undefined) {
      return 0;
    }
    return Number(first['COUNT(0)'] ?? first.count ?? 0);
  }

  override async updateByQuery(query: MySQLQuery): Promise<ResultSetHeader> {
    const options = this.queryToOptions(query);
    const compiled = this.builder.compileSql('update', query.model, options);
    return assertMutationResult(
      await this.execute(
        options.connection ?? null,
        compiled.sql,
        compiled.values,
      ),
      'updateByQuery',
    );
  }

  override async deleteByQuery(query: MySQLQuery): Promise<ResultSetHeader> {
    const options = this.queryToOptions(query);
    const compiled = this.builder.compileSql('delete', query.model, options);
    return assertMutationResult(
      await this.execute(
        options.connection ?? null,
        compiled.sql,
        compiled.values,
      ),
      'deleteByQuery',
    );
  }

  override async insert(
    model: MySQLModel,
    connection: PoolConnection | null,
    data: readonly AdapterData<MySQLField, unknown>[],
  ): Promise<AdapterRow> {
    if (data.length === 0) {
      throw new Error('no insert data.');
    }

    const primaryValues: Record<string, unknown> = {};
    const values: unknown[] = [];
    const assignments = data.map((entry) => {
      const value = restoreFieldValue(entry.field, entry.value);
      if (entry.field.primaryKey || model.primaryKeys.length === 0) {
        primaryValues[entry.field.name] = entry.value;
      }
      values.push(value);
      return `${quoteIdentifier(entry.field.column)} = ?`;
    });
    const sql = `INSERT INTO ${quoteIdentifier(model.name)} SET ${assignments.join(', ')}`;
    const mutation = assertMutationResult(
      await this.execute(connection, sql, values),
      'insert',
    );

    const where = resolveInsertedRowWhere(model, primaryValues, mutation.insertId);
    if (Object.keys(where).length === 0) {
      throw new Error('insert successfully but no unique readback condition is available.');
    }
    const findStatement = this.builder.compileFind(model, {
      fields: model.schema.map((field) => field.name),
      where,
      limit: [0, 1],
    });
    const rows = assertRows(
      await this.execute(connection, findStatement.sql, findStatement.values),
      'insert readback',
    );
    const row = rows[0];
    if (row === undefined) {
      throw new Error('insert successfully but failed to read the record.');
    }
    return row;
  }

  override async update(
    model: MySQLModel,
    connection: PoolConnection | null,
    primaryKey: Readonly<Record<string, unknown>>,
    data: readonly AdapterData<MySQLField, unknown>[],
  ): Promise<ResultSetHeader> {
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
    const mutation = assertMutationResult(
      await this.execute(connection, compiled.sql, compiled.values),
      'update',
    );
    if (mutation.affectedRows === 0) {
      throw new Error('Out-dated yukari data.');
    }
    return mutation;
  }

  override async execute(
    ...arguments_: MySQLExecuteArguments
  ): Promise<QueryResult> {
    const parsed = parseExecuteArguments(arguments_);
    const sqlForLog = this.format(parsed.sql, parsed.values);
    this.emit('sql', sqlForLog);
    this.showSql?.(sqlForLog);

    const target = parsed.connection ?? this.mysql;
    const [result] = parsed.values === undefined || !Array.isArray(parsed.values)
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
    try {
      await connection.commit();
    } finally {
      connection.release();
    }
  }

  override async rollback(connection: PoolConnection): Promise<void> {
    try {
      await connection.rollback();
    } finally {
      connection.release();
    }
  }

  async close(): Promise<void> {
    await this.mysql.end();
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
    const rows = assertRows(
      await this.execute(
        options.connection ?? null,
        compiled.sql,
        compiled.values,
      ),
      'find',
    );
    return options.single ? rows[0] ?? null : rows;
  }

  queryToOptions(
    query: MySQLQuery,
    overrides: Partial<MySQLQueryOptions> = {},
  ): MySQLQueryOptions {
    const options: MySQLQueryOptions = {
      connection: query._conn as PoolConnection | null,
      fields: [...query._fields],
      index: query._index,
      limit: [...query._limit],
      order: [...query._order],
      update: { ...(query._updateData ?? {}) },
      where: { ...query._where },
      ...overrides,
    };

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
    order: readonly Readonly<Record<string, 1 | -1>>[],
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
    return this.builder.makeSql(type, model, options);
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
    password: _password,
    pool: _pool,
    user: _user,
    username: _username,
    ...publicOptions
  } = options;
  return publicOptions;
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

  const sql = entries[1];
  if (typeof sql !== 'string') {
    throw new TypeError('execute() requires a SQL string.');
  }
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

function assertRows(result: QueryResult, operation: string): readonly AdapterRow[] {
  if (!Array.isArray(result) || result.some((row) => !isRow(row))) {
    throw new TypeError(`MySQL ${operation} did not return rows.`);
  }
  return result as RowDataPacket[];
}

function isRow(value: unknown): value is AdapterRow {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertMutationResult(
  result: QueryResult,
  operation: string,
): ResultSetHeader {
  if (result === null || typeof result !== 'object' || Array.isArray(result)) {
    throw new TypeError(`MySQL ${operation} did not return a mutation result.`);
  }
  if (!('affectedRows' in result) || typeof result.affectedRows !== 'number') {
    throw new TypeError(`MySQL ${operation} returned an invalid mutation result.`);
  }
  return result as ResultSetHeader;
}

function restoreFieldValue(field: MySQLField, value: unknown): unknown {
  if (value === null) {
    if (!field.allowNull) {
      throw new TypeError(`field "${field.name}" does not allow null.`);
    }
    return null;
  }
  return field.restore(value);
}

function resolveInsertedRowWhere(
  model: MySQLModel,
  primaryValues: Readonly<Record<string, unknown>>,
  insertId: number,
): Readonly<Record<string, unknown>> {
  const primaryKeys = model.primaryKeys;
  const autoIncrement = model.autoIncrementField ?? model.ai;
  if (insertId > 0) {
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
  return `\`${identifier.replaceAll('`', '``')}\``;
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
