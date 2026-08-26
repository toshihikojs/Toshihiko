import {
  MySQLAdapter,
  type MySQLAdapterOptions,
  type MySQLConnection,
  type MySQLMutationResult,
  type MySQLQueryResult,
} from '../..';
import { Toshihiko, Type } from 'toshihiko';

const options: MySQLAdapterOptions = {
  database: 'typed',
  host: '127.0.0.1',
  username: 'root',
};
const toshihiko = new Toshihiko(MySQLAdapter, options);
const User = toshihiko.define('users', [
  { name: 'id', column: 'user_id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
]);

User.find(true).then((rows) => {
  const id: number | undefined = rows[0]?.id;
  const name: string | undefined = rows[0]?.name;
  void id;
  void name;
});

const adapter = new MySQLAdapter(options);
const database: string = adapter.database;
const pending: Promise<MySQLQueryResult> = adapter.execute('SELECT ?', [1]);
const transaction: Promise<MySQLConnection> = adapter.beginTransaction();
const counted = adapter.count(User.where({ id: { $gte: 1 } }));
const inserted = adapter.insert(User, null, [
  { field: User.fieldNamesMap.id, value: 1 },
  { field: User.fieldNamesMap.name, value: 'Alice' },
]);
const updated: Promise<MySQLMutationResult> = adapter.update(User, null, { id: 1 }, [
  { field: User.fieldNamesMap.name, value: 'Bob' },
]);

void database;
void pending;
void transaction;
void counted;
void inserted;
void updated;

// @ts-expect-error Port remains numeric.
new MySQLAdapter({ port: '3306' });

// @ts-expect-error Callback execution is not part of the v2 API.
adapter.execute('SELECT 1', () => undefined);
