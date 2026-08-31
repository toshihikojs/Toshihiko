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
  DataRow,
  DataValue,
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
  MySQLValue,
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
  where(condition: DataRow): MySQLReadbackQuery;
}

/**
 * mysql2-backed Toshihiko Adapter.
 *
 * Queries are compiled as parameterized SQL. Reads can use a configured Cache;
 * writes invalidate related cached rows before execution. Transaction methods
 * acquire and release mysql2 Pool connections.
 * @zh 基于 mysql2 的 Toshihiko Adapter。
 *
 * 查询会编译为参数化 SQL。读取可以使用配置的 Cache；写入会在执行前使相关缓存数据行失效。事务方法会获取并释放 mysql2 Pool 连接。
 * @ja mysql2 をバックエンドに使用する Toshihiko Adapter です。
 *
 * クエリはパラメーター化された SQL にコンパイルされます。読み取りには設定済みの Cache を使用できます。書き込みでは実行前に関連するキャッシュ済みデータ行を無効化します。トランザクションメソッドは mysql2 の Pool 接続を取得し、処理後に解放します。
 */
export class MySQLAdapter extends Adapter<
  MySQLAdapterOptions,
  MySQLModel,
  PoolConnection,
  MySQLField,
  DataValue,
  MySQLQuery,
  AdapterExecuteSpec<
    MySQLExecuteArguments,
    MySQLQueryExecuteArguments,
    QueryResult
  >
> {
  /** @internal */
  declare readonly [adapterExecuteSpec]: AdapterExecuteSpec<
    MySQLExecuteArguments,
    MySQLQueryExecuteArguments,
    QueryResult
  >;
  /**
   * Configured database name.
   * @zh 配置的数据库名。
   * @ja 設定済みのデータベース名です。
   */
  readonly database: string;
  /**
   * Underlying mysql2 connection Pool.
   * @zh 底层 mysql2 连接池。
   * @ja 基盤となる mysql2 の接続 Pool です。
   */
  declare readonly mysql: Pool;
  /**
   * Driver package name retained for compatibility.
   * @zh 为兼容性保留的驱动软件包名。
   * @ja 互換性のために保持するドライバーパッケージ名です。
   */
  readonly package = 'mysql2';
  /**
   * Configured MySQL username.
   * @zh 配置的 MySQL 用户名。
   * @ja 設定済みの MySQL ユーザー名です。
   */
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
      (this.options as { showSql?: MySQLAdapterOptions['showSql'] }).showSql = showSql!;
    }
    this.mysql.on('connection', () => {
      this.emit('log', 'A new MySQL connection from Toshihiko is set. ⁽⁽ଘ( ˙꒳˙ )ଓ⁾⁾');
    });
  }

  /**
   * Returns the configured database name.
   * @zh 返回配置的数据库名。
   * @ja 設定済みのデータベース名を返します。
   */
  override getDBName(): string {
    return this.database;
  }

  /**
   * Finds rows directly or through the Model Cache.
   * @zh 直接查找数据行，或通过 Model Cache 查找。
   * @ja データ行を直接、または Model の Cache を介して検索します。
   */
  override async find(
    query: MySQLQuery,
    options: AdapterFindOptions = defaultFindOptions,
  ): Promise<AdapterRow | readonly AdapterRow[] | null> {
    const normalized = this.queryToOptions(query, options);
    return !query.cache || options.noCache
      ? this.findWithNoCache(query.model, normalized)
      : this.findWithCache(query.cache, query.model, normalized);
  }

  /**
   * Compiles and executes `COUNT(0)` for a normalized Query.
   * @zh 编译并执行 `COUNT(0)`，用于规范化后的 Query。
   * @ja 正規化済みの Query に対して `COUNT(0)` をコンパイルして実行します。
   */
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

  /**
   * Invalidates related Cache entries and performs a bulk `UPDATE`.
   * @zh 使相关 Cache 条目失效，并执行批量 `UPDATE`。
   * @ja 関連する Cache エントリーを無効化し、一括 `UPDATE` を実行します。
   */
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

  /**
   * Invalidates related Cache entries and performs a bulk `DELETE`.
   * @zh 使相关 Cache 条目失效，并执行批量 `DELETE`。
   * @ja 関連する Cache エントリーを無効化し、一括 `DELETE` を実行します。
   */
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

  /**
   * Inserts one row, then reads it back using generated or supplied key values.
   * @zh 插入一行数据，然后用生成或提供的 key 值重新读取。
   * @ja 1 行を挿入し、生成または指定されたキー値を使用して読み戻します。
   */
  override async insert(
    model: MySQLModel,
    connection: PoolConnection | null,
    data: readonly AdapterData<MySQLField, DataValue>[],
  ): Promise<AdapterRow> {
    const primaryValues: Record<string, DataValue> = {};
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

  /**
   * Updates one row using its original locator and invalidates cached copies.
   * @zh 使用原始定位条件更新一行数据，并使缓存副本失效。
   * @ja 元の特定条件を使用して 1 行を更新し、キャッシュ済みのコピーを無効化します。
   * @throws When the locator or update data is empty, or no row was affected.
   * @zh 定位条件或更新数据为空，或没有数据行受影响时。
   * @ja 特定条件または更新データが空の場合、あるいは更新された行がない場合です。
   */
  override async update(
    model: MySQLModel,
    connection: PoolConnection | null,
    primaryKey: DataRow,
    data: readonly AdapterData<MySQLField, DataValue>[],
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

    const updateData: Record<string, DataValue> = {};
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

  /**
   * Executes parameterized SQL through a selected connection or the Pool.
   *
   * SQL and values are passed separately unless mysql2 formatting requires
   * `query()`, such as named placeholders or identifier placeholders.
   * @zh 通过所选连接或 Pool 执行参数化 SQL。
   *
   * SQL 与值会分开传递，除非 mysql2 格式化需要 `query()`，例如命名占位符或标识符占位符。
   * @ja 選択された接続または Pool を介して、パラメーター化された SQL を実行します。
   *
   * 名前付きプレースホルダーや識別子プレースホルダーなど、mysql2 のフォーマットに `query()` が必要な場合を除き、SQL と値は別々に渡されます。
   */
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

  /**
   * Acquires a Pool connection and begins a transaction on it.
   * @zh 获取一个 Pool 连接并在其上开始事务。
   * @ja Pool 接続を取得し、その接続上でトランザクションを開始します。
   */
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

  /**
   * Commits and releases a transaction connection.
   * @zh 提交并释放事务连接。
   * @ja トランザクション接続をコミットして解放します。
   */
  override async commit(connection: PoolConnection): Promise<void> {
    await connection.commit();
    connection.release();
  }

  /**
   * Rolls back and releases a transaction connection.
   * @zh 回滚并释放事务连接。
   * @ja トランザクション接続をロールバックして解放します。
   */
  override async rollback(connection: PoolConnection): Promise<void> {
    await connection.rollback();
    connection.release();
  }

  /**
   * mysql2 SQL formatter bound to the underlying Pool.
   * @zh 绑定到底层 Pool 的 mysql2 SQL 格式化器。
   * @ja 基盤となる Pool にバインドされた mysql2 の SQL フォーマッターです。
   */
  declare readonly format: (sql: string, values?: MySQLValues) => string;

  /**
   * Executes a compiled read without consulting or populating a Cache.
   * @zh 执行编译后的读取操作，不查询也不写入 Cache。
   * @ja Cache を参照せず、Cache にも保存せずに、コンパイル済みの読み取りを実行します。
   */
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

  /**
   * Reads primary keys, resolves cached rows, fetches misses with at most ten
   * concurrent workers, and preserves the requested field projection.
   * @zh 读取主键、解析缓存数据行、以最多十个并发 worker 获取未命中数据，并保留请求的字段投影。
   * @ja 主キーを読み取り、キャッシュ済みのデータ行を解決し、キャッシュミスを同時に最大 10 個のワーカーで取得します。要求された選択フィールドは維持されます。
   */
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
      options.fields = originalFields!;
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
      const mutable = row as Record<string, DataValue>;
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
      options.fields = originalFields!;
    }
  }

  /**
   * Copies normalized Query state into SQL-builder options.
   *
   * `single: true` also rewrites the limit so at most one row is requested.
   * @zh 把规范化 Query 状态复制到 SQL builder 选项中。
   *
   * `single: true`，同时改写 limit，确保最多请求一行。
   * @ja 正規化済みの Query 状態を SQL builder のオプションへコピーします。
   *
   * `single: true` の場合は limit も書き換え、要求するデータ行を最大 1 行にします。
   */
  queryToOptions(
    query: MySQLQuery,
    overrides: Partial<MySQLQueryOptions> = {},
  ): MySQLQueryOptions {
    const options = extend({
      fields: [...query.fields],
      index: query.index,
      limit: [...query.limit],
      order: [...query.order],
      update: query.updateData,
      where: query.where,
    }, overrides) as MySQLQueryOptions;
    options.conn = query.connection;

    if (!options.single) {
      return options;
    }
    const limit = [...options.limit!];
    if (limit.length === 0) {
      limit.push(0, 1);
    } else if (limit.length === 1) {
      limit[0] = 1;
    } else {
      limit[1] = 1;
    }
    return { ...options, limit };
  }

  /**
   * Formats one logical field condition as SQL.
   * @zh 把一个逻辑字段条件格式化为 SQL。
   * @ja 1 個の論理フィールド条件を SQL としてフォーマットします。
   */
  makeFieldWhere(
    model: MySQLModel,
    key: string,
    condition: DataValue,
    logic?: string,
  ): string {
    return this.builder.makeFieldWhere(model, key, condition, logic);
  }

  /**
   * Formats an array of condition objects joined by the requested logic.
   * @zh 按指定逻辑连接条件对象数组并格式化。
   * @ja 指定された論理演算で結合した条件オブジェクトの配列をフォーマットします。
   */
  makeArrayWhere(
    model: MySQLModel,
    condition: readonly DataRow[],
    logic?: string,
  ): string {
    return this.builder.makeArrayWhere(model, condition, logic);
  }

  /**
   * Formats a complete Toshihiko condition as SQL.
   * @zh 把完整 Toshihiko 条件格式化为 SQL。
   * @ja 完全な Toshihiko 条件を SQL としてフォーマットします。
   */
  makeWhere(
    model: MySQLModel,
    condition: DataRow | readonly DataRow[],
    logic?: string,
  ): string {
    return this.builder.makeWhere(model, condition, logic);
  }

  /**
   * Formats normalized sort entries as an `ORDER BY` fragment body.
   * @zh 把规范化排序条目格式化为 `ORDER BY` 片段主体。
   * @ja 正規化済みのソート項目を `ORDER BY` フラグメントの本体としてフォーマットします。
   */
  makeOrder(
    model: MySQLModel,
    order: readonly Readonly<Record<string, number>>[],
  ): string {
    return this.builder.makeOrder(model, order);
  }

  /**
   * Formats normalized limits as a MySQL `LIMIT` fragment body.
   * @zh 把规范化 limit 格式化为 MySQL `LIMIT` 片段主体。
   * @ja 正規化済みの limit を MySQL の `LIMIT` フラグメントの本体としてフォーマットします。
   */
  makeLimit(
    model: MySQLModel,
    limit: readonly (number | string)[],
  ): string {
    return this.builder.makeLimit(model, limit);
  }

  /**
   * Formats an optional `FORCE INDEX` clause.
   * @zh 格式化可选的 `FORCE INDEX` 子句。
   * @ja 任意の `FORCE INDEX` 句をフォーマットします。
   */
  makeIndex(model: MySQLModel, index?: string): string {
    return this.builder.makeIndex(model, index);
  }

  /**
   * Formats logical update values as a SQL `SET` fragment body.
   * @zh 把逻辑更新值格式化为 SQL `SET` 片段主体。
   * @ja 論理的な更新値を SQL の `SET` フラグメントの本体としてフォーマットします。
   */
  makeSet(model: MySQLModel, update: DataRow): string {
    return this.builder.makeSet(model, update);
  }

  /**
   * Formats a complete `SELECT` statement.
   * @zh 格式化完整的 `SELECT` 语句。
   * @ja 完全な `SELECT` 文をフォーマットします。
   */
  makeFind(model: MySQLModel, options?: MySQLQueryOptions): string {
    return this.builder.makeFind(model, options);
  }

  /**
   * Formats a complete `UPDATE` statement.
   * @zh 格式化完整的 `UPDATE` 语句。
   * @ja 完全な `UPDATE` 文をフォーマットします。
   */
  makeUpdate(model: MySQLModel, options?: MySQLQueryOptions): string {
    return this.builder.makeUpdate(model, options);
  }

  /**
   * Formats a complete `DELETE` statement.
   * @zh 格式化完整的 `DELETE` 语句。
   * @ja 完全な `DELETE` 文をフォーマットします。
   */
  makeDelete(model: MySQLModel, options?: MySQLQueryOptions): string {
    return this.builder.makeDelete(model, options);
  }

  /**
   * Selects the matching SQL formatter for `find`, `count`, `update`, or `delete`.
   * @zh 为以下操作选择对应的 SQL 格式化器：`find`、`count`、`update`，或 `delete`。
   * @ja `find`、`count`、`update`、`delete` の各操作に対応する SQL フォーマッターを選択します。
   */
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
  values: readonly MySQLValue[],
): ExecuteValues {
  return [...values] as ExecuteValues;
}

function resolveInsertedRowWhere(
  model: MySQLModel,
  primaryValues: DataRow,
  insertId: number,
): DataRow {
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
  MySQLValue,
  MySQLValues,
} from './contracts';

export default MySQLAdapter;
