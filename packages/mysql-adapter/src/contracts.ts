import type {
  AdapterQuery,
} from '@toshihiko/base-adapter';
import type { Cache } from 'toshihiko';
import type {
  Pool,
  PoolConnection,
  PoolOptions,
  QueryResult,
  ResultSetHeader,
} from 'mysql2/promise';

export type MySQLValues =
  | readonly unknown[]
  | Readonly<Record<string, unknown>>;

export type MySQLShowSql = false | true | ((sql: string) => void);

export interface MySQLAdapterOptions extends Omit<
  PoolOptions,
  'database' | 'password' | 'user'
> {
  readonly [key: string]: unknown;
  readonly database?: string;
  readonly password?: string;
  readonly package?: string;
  readonly pool?: Pool;
  readonly showSql?: MySQLShowSql;
  readonly user?: string;
  readonly username?: string;
}

export interface MySQLField {
  readonly allowNull: boolean;
  readonly autoIncrement: boolean;
  readonly column: string;
  readonly name: string;
  readonly primaryKey: boolean;
  readonly type?: {
    readonly needQuotes?: boolean;
  };
  restore(value: unknown): unknown;
}

export interface MySQLModel {
  readonly ai: MySQLField | null;
  readonly autoIncrementField: MySQLField | null;
  readonly cache: Cache | null;
  readonly fieldNamesMap: Readonly<Record<string, MySQLField | undefined>>;
  readonly name: string;
  readonly nameToColumn: Readonly<Record<string, string | undefined>>;
  readonly primaryKeys: readonly MySQLField[];
  readonly schema: readonly MySQLField[];
  convertColumnToName(
    value: Readonly<Record<string, unknown>>,
  ): Readonly<Record<string, unknown>>;
}

export interface MySQLQuery extends AdapterQuery<
  MySQLModel,
  PoolConnection,
  Cache | null
> {}

export interface MySQLQueryOptions {
  conn?: PoolConnection | null;
  count?: boolean;
  fields?: string[];
  index?: string;
  limit?: number[];
  noCache?: boolean;
  order?: Record<string, number>[];
  single?: boolean;
  update?: Record<string, unknown>;
  where?: Record<string, unknown>;
}

export interface MySQLStatement {
  readonly sql: string;
  readonly values: readonly unknown[];
}

export type MySQLExecuteArguments =
  | readonly [sql: string, values?: MySQLValues]
  | readonly [
    connection: PoolConnection | null,
    sql: string,
    values?: MySQLValues,
  ];

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
