import type { AdapterData } from '@toshihiko/base-adapter';
import { format } from 'mysql2';
import {
  Toshihiko,
  type Model,
  type SchemaDefinition,
} from 'toshihiko';
import type {
  MySQLAdapter,
  MySQLConnection,
  MySQLField,
  MySQLModel,
  MySQLPool,
  MySQLValues,
} from '../../dist';

export interface TestCall {
  readonly method: 'execute' | 'query';
  readonly sql: string;
  readonly values: MySQLValues | undefined;
}

export type TestPool = MySQLPool & {
  readonly calls: TestCall[];
};

export type TestConnection = MySQLConnection & {
  readonly calls: TestCall[];
};

export function createPool(
  responses: readonly unknown[] = [],
  acquireConnection?: () => Promise<MySQLConnection>,
): TestPool {
  const calls: TestCall[] = [];
  let responseIndex = 0;

  async function run(
    method: TestCall['method'],
    sql: string,
    values?: MySQLValues,
  ): Promise<readonly [unknown, readonly never[]]> {
    calls.push({ method, sql, values });
    const response = responses[responseIndex++];
    if (response instanceof Error) {
      throw response;
    }
    return [response ?? [], []];
  }

  const pool = {
    calls,
    async end() {},
    execute(sql: string, values?: MySQLValues) {
      return run('execute', sql, values);
    },
    format,
    async getConnection(): Promise<MySQLConnection> {
      if (acquireConnection === undefined) {
        throw new Error('getConnection not configured');
      }
      return acquireConnection();
    },
    on() {
      return this;
    },
    query(sql: string, values?: MySQLValues) {
      return run('query', sql, values);
    },
  };

  return pool as unknown as TestPool;
}

export function createConnection(
  responses: readonly unknown[] = [],
): TestConnection {
  return createPool(responses) as unknown as TestConnection;
}

export function asConnection(connection: object): MySQLConnection {
  return connection as MySQLConnection;
}

export function dataFor(
  model: MySQLModel,
  values: Readonly<Record<string, unknown>>,
): readonly AdapterData<MySQLField, unknown>[] {
  return Object.entries(values).map(([name, value]) => {
    const field = model.fieldNamesMap[name];
    if (field === undefined) {
      throw new Error(`no field named "${name}" in model "${model.name}"`);
    }
    return { field, value };
  });
}

export function define<
  const Name extends string,
  const Schema extends SchemaDefinition,
>(
  adapter: MySQLAdapter,
  name: Name,
  schema: Schema,
): Model<Name, Schema> {
  return new Toshihiko(adapter).define(name, schema);
}
