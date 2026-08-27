import {
  MySQLAdapter,
  MySQLSqlBuilder,
  type MySQLAdapterOptions,
  type MySQLConnection,
  type MySQLMutationResult,
  type MySQLQueryResult,
  type MySQLStatement,
} from '../..';
import {
  Toshihiko,
  Type,
  type AdapterExecuteResult,
  type FieldType,
} from 'toshihiko';

const BinaryType = {
  name: 'Binary',
  needQuotes: false,
  parse(value: string) {
    return { dec: Number.parseInt(value, 2) };
  },
  restore(value: { readonly dec: number }) {
    return `BIN(${value.dec})`;
  },
} satisfies FieldType<{ readonly dec: number }, string>;

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
const Binary = toshihiko.define('binary_values', [
  { name: 'value', type: BinaryType },
]);

User.find(true).then((rows) => {
  const id: number | undefined = rows[0]?.id;
  const name: string | undefined = rows[0]?.name;
  void id;
  void name;
});

const adapter = new MySQLAdapter(options);
const statement: MySQLStatement = new MySQLSqlBuilder().compileFind(User, {
  where: { id: 1 },
});
const rawStatement: MySQLStatement = new MySQLSqlBuilder().compileSet(Binary, {
  value: { dec: 7 },
});
const database: string = adapter.database;
const pending: Promise<MySQLQueryResult> = adapter.execute('SELECT ?', [1]);
const transaction: Promise<MySQLConnection> = adapter.beginTransaction();
const modelTransaction: Promise<MySQLConnection> = User.beginTransaction();
transaction.then((connection) => {
  const commit: Promise<void> = User.commit(connection);
  const rollback: Promise<void> = User.rollback(connection);
  User.conn(connection);
  User.build({ id: 1, name: 'Alice' }).insert(connection);
  User.build({ id: 1, name: 'Alice' }).save(connection);
  User.findById(1).then((user) => {
    user?.update(connection);
    user?.save(connection);
    user?.delete(connection);
  });
  void commit;
  void rollback;
});
const counted: Promise<number> = User.where({ id: { $gte: 1 } }).count();
const queryUpdated: Promise<MySQLMutationResult> = User.where({ id: 1 }).update({ name: 'Bob' });
const queryDeleted: Promise<MySQLMutationResult> = User.where({ id: 1 }).delete();
const rootExecuted: Promise<MySQLQueryResult> = toshihiko.execute('SELECT ?', [1]);
const queryExecuted: Promise<MySQLQueryResult> = User.execute('SELECT ?', [1]);
const directExecuteResult: MySQLQueryResult = null as unknown as AdapterExecuteResult<MySQLAdapter>;
const inserted = adapter.insert(User, null, [
  { field: User.fieldNamesMap.id, value: 1 },
  { field: User.fieldNamesMap.name, value: 'Alice' },
]);
const updated: Promise<MySQLMutationResult> = adapter.update(User, null, { id: 1 }, [
  { field: User.fieldNamesMap.name, value: 'Bob' },
]);

void database;
void statement;
void rawStatement;
void pending;
void transaction;
void modelTransaction;
void counted;
void queryUpdated;
void queryDeleted;
void rootExecuted;
void queryExecuted;
void directExecuteResult;
void inserted;
void updated;

// @ts-expect-error Port remains numeric.
new MySQLAdapter({ port: '3306' });

// @ts-expect-error MySQL queries only accept MySQL transaction connections.
User.conn({ transaction: 1 });
