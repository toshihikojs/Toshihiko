import type {
  AdapterFindResult,
  AdapterQuery,
  AdapterRow,
  AdapterTypeMap,
} from '@toshihiko/base-adapter';
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
  restore(value: unknown): unknown;
}

export interface MySQLModel {
  readonly ai: MySQLField | null;
  readonly autoIncrementField: MySQLField | null;
  readonly fieldNamesMap: Readonly<Record<string, MySQLField | undefined>>;
  readonly name: string;
  readonly nameToColumn: Readonly<Record<string, string | undefined>>;
  readonly primaryKeys: readonly MySQLField[];
  readonly schema: readonly MySQLField[];
}

export interface MySQLQuery extends AdapterQuery<MySQLModel> {
  readonly _updateData?: Readonly<Record<string, unknown>>;
}

export interface MySQLQueryOptions {
  readonly connection?: PoolConnection | null;
  readonly count?: boolean;
  readonly fields?: readonly string[];
  readonly index?: string;
  readonly limit?: readonly number[];
  readonly noCache?: boolean;
  readonly order?: readonly Readonly<Record<string, 1 | -1>>[];
  readonly single?: boolean;
  readonly update?: Readonly<Record<string, unknown>>;
  readonly where?: Readonly<Record<string, unknown>>;
}

export type MySQLExecuteArguments =
  | readonly [sql: string, values?: MySQLValues]
  | readonly [
    connection: PoolConnection | null,
    sql: string,
    values?: MySQLValues,
  ];

export interface MySQLAdapterTypeMap extends AdapterTypeMap {
  readonly connection: PoolConnection;
  readonly executeArguments: MySQLExecuteArguments;
  readonly executeResult: QueryResult;
  readonly field: MySQLField;
  readonly fieldValue: unknown;
  readonly findResult: AdapterFindResult;
  readonly insertResult: AdapterRow;
  readonly mutationResult: ResultSetHeader;
  readonly options: MySQLAdapterOptions;
  readonly query: MySQLQuery;
}

export type {
  Pool as MySQLPool,
  PoolConnection as MySQLConnection,
  QueryResult as MySQLQueryResult,
  ResultSetHeader as MySQLMutationResult,
};
