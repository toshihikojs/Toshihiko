import type {
  AdapterQuery,
} from '@toshihiko/base-adapter';
import type { Cache, CacheSource, DataRow, DataValue } from 'toshihiko';
import type {
  Pool,
  PoolConnection,
  PoolOptions,
  QueryValues,
  QueryResult,
  ResultSetHeader,
} from 'mysql2/promise';

/** One value accepted by mysql2 query placeholders. */
export type MySQLValue = QueryValues;

/** Positional or named placeholder values accepted by mysql2. */
export type MySQLValues =
  | readonly MySQLValue[]
  | Readonly<Record<string, MySQLValue>>;

/** SQL logging option: disabled, console logging, or a custom sink. */
export type MySQLShowSql = false | true | ((sql: string) => void);

/** mysql2 Pool options plus Toshihiko Adapter configuration. */
export interface MySQLAdapterOptions extends Omit<
  PoolOptions,
  'database' | 'password' | 'user'
> {
  /** Cache instance or module-style Cache configuration. */
  readonly cache?: CacheSource;
  /** Database name; defaults to `toshihiko`. */
  readonly database?: string;
  /** MySQL password. */
  readonly password?: string;
  /** Driver package name retained for compatibility. */
  readonly package?: string;
  /** Existing mysql2 Pool. */
  readonly pool?: Pool;
  /** SQL logging behavior. */
  readonly showSql?: MySQLShowSql;
  /** MySQL username. */
  readonly user?: string;
  /** Compatibility alias for {@link user}. */
  readonly username?: string;
}

/** Minimal compiled Field surface required by the MySQL Adapter. */
export interface MySQLField {
  /** Whether the field accepts `null`. */
  readonly allowNull: boolean;
  /** Whether MySQL generates the field during insert. */
  readonly autoIncrement: boolean;
  /** Quoted storage column source name. */
  readonly column: string;
  /** Logical schema field name. */
  readonly name: string;
  /** Whether the field participates in row locators. */
  readonly primaryKey: boolean;
  /** Minimal quoting metadata used by the SQL builder. */
  readonly type?: {
    readonly needQuotes?: boolean;
  };
  /** Restores an application value into a mysql2-compatible value. */
  restore(value: DataValue): MySQLValue;
}

/** Minimal Model surface required by the MySQL Adapter. */
export interface MySQLModel {
  /** Compatibility alias for {@link autoIncrementField}. */
  readonly ai: MySQLField | null;
  /** Auto-increment field, when configured. */
  readonly autoIncrementField: MySQLField | null;
  /** Effective Model Cache. */
  readonly cache: Cache | null;
  /** Logical field name to compiled Field. */
  readonly fieldNamesMap: Readonly<Record<string, MySQLField | undefined>>;
  /** Storage table name. */
  readonly name: string;
  /** Logical field name to storage column. */
  readonly nameToColumn: Readonly<Record<string, string | undefined>>;
  /** Fields used to locate one row. */
  readonly primaryKeys: readonly MySQLField[];
  /** Complete compiled schema. */
  readonly schema: readonly MySQLField[];
  /** Converts a storage row to logical field names. */
  convertColumnToName(
    value: DataRow,
  ): DataRow;
}

/** Normalized Query shape consumed by the MySQL Adapter. */
export interface MySQLQuery extends AdapterQuery<
  MySQLModel,
  PoolConnection,
  Cache | null
> {}

/** Internal SQL-builder options derived from a normalized Query. */
export interface MySQLQueryOptions {
  /** Selected mysql2 transaction connection. */
  conn?: PoolConnection | null;
  /** Compile a count projection. */
  count?: boolean;
  /** Logical fields or expressions to select. */
  fields?: string[];
  /** Optional index hint. */
  index?: string;
  /** Empty, `[count]`, or `[offset, count]`. */
  limit?: number[];
  /** Bypass query-result caching. */
  noCache?: boolean;
  /** Normalized sort expressions. */
  order?: Record<string, number>[];
  /** Request at most one row. */
  single?: boolean;
  /** Logical field values for an update. */
  update?: DataRow;
  /** Logical query condition. */
  where?: DataRow;
}

/** Parameterized SQL text and its ordered placeholder values. */
export interface MySQLStatement {
  /** SQL text containing `?` placeholders. */
  readonly sql: string;
  /** Values bound to placeholders in order. */
  readonly values: readonly MySQLValue[];
}

/** Raw execution overloads accepted by `Toshihiko.execute()`. */
export type MySQLExecuteArguments =
  | readonly [sql: string, values?: MySQLValues]
  | readonly [
    connection: PoolConnection | null,
    sql: string,
    values?: MySQLValues,
  ];

/** Raw execution arguments accepted after `Query.conn()`. */
export type MySQLQueryExecuteArguments = readonly [
  sql: string,
  values?: MySQLValues,
];

export type {
  Pool as MySQLPool,
  PoolConnection as MySQLConnection,
  QueryResult as MySQLQueryResult,
  ResultSetHeader as MySQLMutationResult,
};
