import assert from 'node:assert/strict';
import test from 'node:test';
import { Adapter } from '@toshihiko/base-adapter';
import { Type, type FieldType } from 'toshihiko';
import {
  MySQLAdapter,
  type MySQLModel,
  type MySQLQueryOptions,
} from '../../dist';
import {
  asConnection,
  createConnection,
  createPool,
  dataFor,
  define,
} from '../helpers/mysql';

const BinaryType = Object.freeze({
  name: 'Binary',
  needQuotes: false,
  parse(value: unknown) {
    return { dec: Number.parseInt(String(value), 2) };
  },
  restore(value: { readonly dec: number }) {
    return `BIN(${Number.parseInt(String(value.dec), 10)})`;
  },
}) satisfies FieldType<{ readonly dec: number }, string>;

test('v1 construction keeps Adapter identity, public options, and credentials private', async () => {
  const pool = createPool();
  const options = Object.freeze({
    database: 'test',
    host: '127.0.0.1',
    password: 'secret',
    pool,
    username: 'root',
  });
  const adapter = new MySQLAdapter(options);

  assert.equal(adapter instanceof Adapter, true);
  assert.equal(adapter.database, 'test');
  assert.equal(adapter.username, 'root');
  assert.equal(adapter.options.host, '127.0.0.1');
  assert.equal(adapter.options.database, undefined);
  assert.equal(adapter.options.password, undefined);
  assert.equal(adapter.options.pool, undefined);
  assert.equal(adapter.options.username, undefined);
  assert.equal('package' in adapter, false);
  assert.deepEqual(options, {
    database: 'test',
    host: '127.0.0.1',
    password: 'secret',
    pool,
    username: 'root',
  });
  await adapter.close();

  const defaults = new MySQLAdapter({ pool: createPool() });
  assert.equal(defaults.options.host, 'localhost');
  assert.equal(defaults.options.port, 3306);
});

test('v1 showSql receives formatted SQL on success and failure', async () => {
  const shown: string[] = [];
  const pool = createPool([[{ ok: 1 }], new Error('database failed')]);
  const adapter = new MySQLAdapter({ pool, showSql: (sql) => shown.push(sql) });

  await adapter.execute('SELECT ?', [1]);
  await assert.rejects(adapter.execute('SELECT ?', [2]), /database failed/);
  assert.deepEqual(shown, ['SELECT 1', 'SELECT 2']);
});

test('v1 execute selects prepared, raw, object-expansion, and connection paths', async () => {
  const pool = createPool([
    [{ prepared: 1 }],
    [{ raw: 1 }],
    { affectedRows: 1 },
    { affectedRows: 0 },
  ]);
  const connection = createConnection([[{ connected: 1 }]]);
  const adapter = new MySQLAdapter({ pool });

  assert.deepEqual(await adapter.execute('SELECT ?', [1]), [{ prepared: 1 }]);
  assert.deepEqual(await adapter.execute('SELECT 1'), [{ raw: 1 }]);
  assert.deepEqual(
    await adapter.execute('INSERT INTO `users` SET ?', { name: 'Alice' }),
    { affectedRows: 1 },
  );
  assert.deepEqual(await adapter.execute(connection, 'SELECT ?', [2]), [{ connected: 1 }]);
  await adapter.execute('CREATE TABLE ?? (`id` INT(?))', ['legacy_table', 11]);
  assert.equal(pool.calls[0]?.method, 'execute');
  assert.equal(pool.calls[1]?.method, 'query');
  assert.equal(pool.calls[2]?.method, 'query');
  assert.deepEqual(pool.calls[3], {
    method: 'query',
    sql: 'CREATE TABLE ?? (`id` INT(?))',
    values: ['legacy_table', 11],
  });
  assert.deepEqual(connection.calls[0], {
    method: 'execute',
    sql: 'SELECT ?',
    values: [2],
  });
});

test('v1 queryToOptions preserves query state and single-row limit rules', () => {
  const adapter = new MySQLAdapter({ pool: createPool() });
  const User = define(adapter, 'users', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
  ]);
  const connection = { marker: true };
  const query = User.where({ id: { $gte: 2 } })
    .fields('id,name')
    .order({ name: -1 })
    .limit(10, 20)
    .index('idx')
    .conn(connection);
  query._updateData = { name: 'Bob' };

  assert.deepEqual(adapter.queryToOptions(query), {
    connection,
    fields: ['id', 'name'],
    index: 'idx',
    limit: [10, 20],
    order: [{ name: -1 }],
    update: { name: 'Bob' },
    where: { id: { $gte: 2 } },
  });
  assert.deepEqual(adapter.queryToOptions(User.where({}), { single: true }).limit, [0, 1]);
  assert.deepEqual(adapter.queryToOptions(User.limit(10), { single: true }).limit, [1]);
  assert.deepEqual(adapter.queryToOptions(User.limit(2, 10), { single: true }).limit, [2, 1]);
});

test('v1 makeSql dispatch remains override-compatible', () => {
  const adapter = new MySQLAdapter({ pool: createPool() });
  const User = define(adapter, 'users', [{ name: 'id', type: Type.Integer }]);
  const calls: Array<[
    'find' | 'update' | 'delete',
    MySQLModel,
    MySQLQueryOptions | undefined,
  ]> = [];
  adapter.makeFind = (model: MySQLModel, options?: MySQLQueryOptions) => {
    calls.push(['find', model, options]);
    return 'FIND';
  };
  adapter.makeUpdate = (model: MySQLModel, options?: MySQLQueryOptions) => {
    calls.push(['update', model, options]);
    return 'UPDATE';
  };
  adapter.makeDelete = (model: MySQLModel, options?: MySQLQueryOptions) => {
    calls.push(['delete', model, options]);
    return 'DELETE';
  };

  assert.equal(adapter.makeSql('find', User, { where: {} }), 'FIND');
  assert.equal(adapter.makeSql('legacy-unknown', User, { where: {} }), 'FIND');
  assert.equal(adapter.makeSql('count', User, { where: {} }), 'FIND');
  assert.equal(adapter.makeSql('update', User, { where: {} }), 'UPDATE');
  assert.equal(adapter.makeSql('delete', User, { where: {} }), 'DELETE');
  assert.equal(calls[2]?.[2]?.count, true);
});

test('v1 findWithNoCache preserves list, single, empty, and connection failures', async () => {
  const pool = createPool([
    [{ id: 1 }, { id: 2 }],
    [{ id: 1 }],
    [],
  ]);
  const adapter = new MySQLAdapter({ pool });
  const User = define(adapter, 'users', [{ name: 'id', type: Type.Integer, primaryKey: true }]);

  assert.deepEqual(await adapter.findWithNoCache(User, { order: [{ id: 1 }] }), [{ id: 1 }, { id: 2 }]);
  assert.deepEqual(await adapter.findWithNoCache(User, { single: true, limit: [0, 1] }), { id: 1 });
  assert.equal(await adapter.findWithNoCache(User, { single: true, limit: [100, 1] }), null);

  const connection = createConnection([new Error('dummy')]);
  await assert.rejects(
    adapter.findWithNoCache(User, { connection, where: { id: 1 } }),
    /dummy/,
  );
});

test('v1 count handles COUNT aliases, empty results, and invalid result shapes', async () => {
  const pool = createPool([
    [{ 'COUNT(0)': 3 }],
    [{ count: '4' }],
    [],
    { affectedRows: 1 },
  ]);
  const adapter = new MySQLAdapter({ pool });
  const User = define(adapter, 'users', [{ name: 'id', type: Type.Integer, primaryKey: true }]);

  assert.equal(await adapter.count(User.where({ id: { $gte: 2 } })), 3);
  assert.equal(await adapter.count(User.where({})), 4);
  assert.equal(await adapter.count(User.where({})), 0);
  await assert.rejects(adapter.count(User.where({})), /did not return rows/);
});

test('v1 insert reads auto-increment primary keys back with bound values', async () => {
  const pool = createPool([
    { affectedRows: 1, insertId: 4 },
    [{ id: 4, name: 'Alice' }],
  ]);
  const adapter = new MySQLAdapter({ pool });
  const User = define(adapter, 'users', [
    { name: 'id', type: Type.Integer, primaryKey: true, autoIncrement: true },
    { name: 'name', type: Type.String },
  ]);

  assert.deepEqual(await adapter.insert(User, null, dataFor(User, { name: 'Alice' })), {
    id: 4,
    name: 'Alice',
  });
  assert.deepEqual(pool.calls[1], {
    method: 'execute',
    sql: 'SELECT `id`, `name` FROM `users` WHERE (`id` = ?) LIMIT 0, 1',
    values: [4],
  });
});

test('v1 insert reads an auto-increment non-primary row by its supplied primary key', async () => {
  const pool = createPool([
    { affectedRows: 1, insertId: 7 },
    [{ sequence: 7, code: 'A' }],
  ]);
  const adapter = new MySQLAdapter({ pool });
  const Item = define(adapter, 'items', [
    { name: 'sequence', type: Type.Integer, autoIncrement: true },
    { name: 'code', type: Type.String, primaryKey: true },
  ]);

  await adapter.insert(Item, null, dataFor(Item, { code: 'A' }));
  assert.deepEqual(pool.calls[1], {
    method: 'execute',
    sql: 'SELECT `sequence`, `code` FROM `items` WHERE (`code` = ?) LIMIT 0, 1',
    values: ['A'],
  });
});

test('v1 insert reads composite primary keys using generated and supplied values', async () => {
  const pool = createPool([
    { affectedRows: 1, insertId: 8 },
    [{ id: 8, tenant: 'east', name: 'Alice' }],
  ]);
  const adapter = new MySQLAdapter({ pool });
  const User = define(adapter, 'users', [
    { name: 'id', type: Type.Integer, primaryKey: true, autoIncrement: true },
    { name: 'tenant', type: Type.String, primaryKey: true },
    { name: 'name', type: Type.String },
  ]);

  await adapter.insert(User, null, dataFor(User, { tenant: 'east', name: 'Alice' }));
  assert.deepEqual(pool.calls[1], {
    method: 'execute',
    sql: 'SELECT `id`, `tenant`, `name` FROM `users` WHERE (`tenant` = ? AND `id` = ?) LIMIT 0, 1',
    values: ['east', 8],
  });
});

test('v1 insert without primary keys uses every supplied value plus insertId', async () => {
  const pool = createPool([
    { affectedRows: 1, insertId: 9 },
    [{ id: 9, name: 'Alice', score: 2.5 }],
  ]);
  const adapter = new MySQLAdapter({ pool });
  const User = define(adapter, 'users', [
    { name: 'id', type: Type.Integer, autoIncrement: true },
    { name: 'name', type: Type.String },
    { name: 'score', type: Type.Float },
  ]);

  await adapter.insert(User, null, dataFor(User, { name: 'Alice', score: 2.5 }));
  assert.deepEqual(pool.calls[1], {
    method: 'execute',
    sql: 'SELECT `id`, `name`, `score` FROM `users` WHERE (`name` = ? AND `score` = ? AND `id` = ?) LIMIT 0, 1',
    values: ['Alice', 2.5, 9],
  });
});

test('v1 insert without auto-increment uses supplied primary or full row values', async () => {
  const primaryPool = createPool([
    { affectedRows: 1, insertId: 0 },
    [{ id: 1, score: 0.5 }],
  ]);
  const primaryAdapter = new MySQLAdapter({ pool: primaryPool });
  const Primary = define(primaryAdapter, 'primary_items', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'score', type: Type.Float },
  ]);
  await primaryAdapter.insert(Primary, null, dataFor(Primary, { id: 1, score: 0.5 }));
  assert.deepEqual(primaryPool.calls[1]?.values, [1]);

  const rowPool = createPool([
    { affectedRows: 1, insertId: 0 },
    [{ id: 2, score: 1 }],
  ]);
  const rowAdapter = new MySQLAdapter({ pool: rowPool });
  const NoPrimary = define(rowAdapter, 'plain_items', [
    { name: 'id', type: Type.Integer },
    { name: 'score', type: Type.Float },
  ]);
  await rowAdapter.insert(NoPrimary, null, dataFor(NoPrimary, { id: 2, score: 1 }));
  assert.deepEqual(rowPool.calls[1]?.values, [2, 1]);
});

test('v1 insert uses the supplied connection for write and readback', async () => {
  const pool = createPool();
  const connection = createConnection([
    { affectedRows: 1, insertId: 0 },
    [{ id: 3 }],
  ]);
  const adapter = new MySQLAdapter({ pool });
  const Item = define(adapter, 'items', [{ name: 'id', type: Type.Integer, primaryKey: true }]);

  await adapter.insert(Item, connection, dataFor(Item, { id: 3 }));
  assert.equal(pool.calls.length, 0);
  assert.equal(connection.calls.length, 2);
});

test('v1 insert preserves custom unquoted field expressions', async () => {
  const pool = createPool([
    { affectedRows: 1, insertId: 1 },
    [{ id: 1, bits: '111' }],
  ]);
  const adapter = new MySQLAdapter({ pool });
  const Item = define(adapter, 'items', [
    { name: 'id', type: Type.Integer, primaryKey: true, autoIncrement: true },
    { name: 'bits', type: BinaryType },
  ]);

  await adapter.insert(Item, null, dataFor(Item, { bits: { dec: 7 } }));
  assert.deepEqual(pool.calls[0], {
    method: 'execute',
    sql: 'INSERT INTO `items` SET `bits` = BIN(7)',
    values: [],
  });
});

test('v1 insert rejects missing data, ambiguous readback, and missing rows', async () => {
  const adapter = new MySQLAdapter({ pool: createPool() });
  const Empty = define(adapter, 'empty_items', [{ name: 'id', type: Type.Integer }]);
  await assert.rejects(adapter.insert(Empty, null, []), /no insert data/);

  const ambiguousAdapter = new MySQLAdapter({
    pool: createPool([{ affectedRows: 1, insertId: 0 }]),
  });
  const Ambiguous = define(ambiguousAdapter, 'ambiguous_items', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
  ]);
  await assert.rejects(
    ambiguousAdapter.insert(Ambiguous, null, dataFor(Ambiguous, { name: 'Alice' })),
    /no unique readback condition/,
  );

  const missingAdapter = new MySQLAdapter({
    pool: createPool([{ affectedRows: 1, insertId: 2 }, []]),
  });
  const Missing = define(missingAdapter, 'missing_items', [
    { name: 'id', type: Type.Integer, primaryKey: true, autoIncrement: true },
    { name: 'name', type: Type.String },
  ]);
  await assert.rejects(
    missingAdapter.insert(Missing, null, dataFor(Missing, { name: 'Alice' })),
    /failed to read the record/,
  );

  const malformedAdapter = new MySQLAdapter({ pool: createPool([[]]) });
  const Malformed = define(malformedAdapter, 'malformed_items', [
    { name: 'id', type: Type.Integer, primaryKey: true },
  ]);
  await assert.rejects(
    malformedAdapter.insert(Malformed, null, dataFor(Malformed, { id: 1 })),
    /did not return a mutation result/,
  );
});

test('v1 update preserves bound values, raw expressions, and connection selection', async () => {
  const pool = createPool();
  const connection = createConnection([{ affectedRows: 1, insertId: 0 }]);
  const adapter = new MySQLAdapter({ pool });
  const Item = define(adapter, 'items', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
    { name: 'bits', type: BinaryType },
  ]);

  await adapter.update(Item, connection, { id: 1 }, dataFor(Item, {
    name: 'Bob',
    bits: { dec: 7 },
  }));
  assert.equal(pool.calls.length, 0);
  assert.deepEqual(connection.calls[0], {
    method: 'execute',
    sql: 'UPDATE `items` SET `name` = ?, `bits` = BIN(7) WHERE (`id` = ?)',
    values: ['Bob', 1],
  });
});

test('v1 update rejects broken state and stale records', async () => {
  const adapter = new MySQLAdapter({
    pool: createPool([{ affectedRows: 0, insertId: 0 }]),
  });
  const Item = define(adapter, 'items', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
  ]);
  const data = dataFor(Item, { name: 'Bob' });

  await assert.rejects(adapter.update(Item, null, {}, data), /Broken yukari object/);
  await assert.rejects(adapter.update(Item, null, { id: 1 }, []), /Broken update data information/);
  await assert.rejects(adapter.update(Item, null, { id: 1 }, data), /Out-dated yukari data/);
});

test('v1 updateByQuery and deleteByQuery preserve query clauses and values', async () => {
  const pool = createPool([
    { affectedRows: 2, insertId: 0 },
    { affectedRows: 1, insertId: 0 },
  ]);
  const adapter = new MySQLAdapter({ pool });
  const Item = define(adapter, 'items', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'score', type: Type.Float },
  ]);
  const update = Item.where({ id: { $lt: 3 } }).order({ id: -1 }).limit(5);
  update._updateData = { score: 2.5 };
  assert.equal((await adapter.updateByQuery(update)).affectedRows, 2);
  assert.deepEqual(pool.calls[0], {
    method: 'execute',
    sql: 'UPDATE `items` SET `score` = ? WHERE (`id` < ?) ORDER BY `id` DESC LIMIT 5',
    values: [2.5, 3],
  });

  const deletion = Item.where({ score: { $gte: 2 } }).order({ id: -1 }).limit(0, 1);
  assert.equal((await adapter.deleteByQuery(deletion)).affectedRows, 1);
  assert.deepEqual(pool.calls[1], {
    method: 'execute',
    sql: 'DELETE FROM `items` WHERE (`score` >= ?) ORDER BY `id` DESC LIMIT 1',
    values: [2],
  });
});

test('v1 mutation methods reject malformed driver results', async () => {
  const pool = createPool([[], []]);
  const adapter = new MySQLAdapter({ pool });
  const Item = define(adapter, 'items', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
  ]);
  const update = Item.where({ id: 1 });
  update._updateData = { name: 'Bob' };
  await assert.rejects(adapter.updateByQuery(update), /did not return a mutation result/);
  await assert.rejects(adapter.deleteByQuery(Item.where({ id: 1 })), /did not return a mutation result/);
});

test('v1 query mutations propagate errors from a supplied connection', async () => {
  const pool = createPool();
  const connection = createConnection([new Error('dummy update'), new Error('dummy delete')]);
  const adapter = new MySQLAdapter({ pool });
  const Item = define(adapter, 'items', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
  ]);
  const update = Item.where({ id: 1 }).conn(connection);
  update._updateData = { name: 'Bob' };

  await assert.rejects(adapter.updateByQuery(update), /dummy update/);
  await assert.rejects(adapter.deleteByQuery(Item.where({ id: 1 }).conn(connection)), /dummy delete/);
  assert.equal(pool.calls.length, 0);
});

test('v1 transactions release connections after begin, commit, rollback, and failures', async () => {
  const events: string[] = [];
  const connection = asConnection({
    async beginTransaction() {
      events.push('begin');
    },
    async commit() {
      events.push('commit');
    },
    async rollback() {
      events.push('rollback');
      throw new Error('rollback failed');
    },
    release() {
      events.push('release');
    },
  });
  const pool = createPool([], async () => connection);
  const adapter = new MySQLAdapter({ pool });

  assert.equal(await adapter.beginTransaction(), connection);
  await adapter.commit(connection);
  await assert.rejects(adapter.rollback(connection), /rollback failed/);
  assert.deepEqual(events, ['begin', 'commit', 'release', 'rollback', 'release']);

  const failedConnection = asConnection({
    async beginTransaction() {
      throw new Error('begin failed');
    },
    release() {
      events.push('failed-release');
    },
  });
  const failedPool = createPool([], async () => failedConnection);
  const failedAdapter = new MySQLAdapter({ pool: failedPool });
  await assert.rejects(failedAdapter.beginTransaction(), /begin failed/);
  assert.equal(events.at(-1), 'failed-release');
});
