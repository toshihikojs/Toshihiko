import assert from 'node:assert/strict';
import test from 'node:test';
import { Toshihiko, Type } from 'toshihiko';
import { MySQLAdapter } from '../../dist';
import {
  asConnection,
  createConnection,
  createPool,
} from '../helpers/mysql';

test('find and count execute through the Promise pool', async () => {
  const pool = createPool([
    [{ user_id: 1, name: 'Alice' }],
    [{ 'COUNT(0)': 3 }],
  ]);
  const adapter = new MySQLAdapter({ pool, database: 'typed', showSql: false });
  assert.equal(adapter.options.password, undefined);
  assert.equal(adapter.options.pool, undefined);
  const toshihiko = new Toshihiko(adapter);
  const User = toshihiko.define('users', [
    { name: 'id', column: 'user_id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
  ]);

  const row = await User.where({ id: 1 }).findOne(true);
  assert.deepEqual(row, { id: 1, name: 'Alice' });
  assert.equal(await User.where({ id: { $gte: 2 } }).count(), 3);
  assert.deepEqual(pool.calls[0], {
    method: 'execute',
    sql: 'SELECT `user_id`, `name` FROM `users` WHERE (`user_id` = ?) LIMIT 0, 1',
    values: [1],
  });
  assert.deepEqual(pool.calls[1], {
    method: 'execute',
    sql: 'SELECT COUNT(0) FROM `users` WHERE (`user_id` >= ?)',
    values: [2],
  });
});

test('execute preserves direct and connection-first argument order', async () => {
  const pool = createPool([[{ ok: 1 }]]);
  const connection = createConnection([[{ connected: true }]]);
  const shown: string[] = [];
  const adapter = new MySQLAdapter({ pool, showSql: (sql) => shown.push(sql) });

  await adapter.execute('SELECT ?', [1]);
  await adapter.execute(connection, 'SELECT ?', [2]);
  await adapter.execute('SELECT 1');
  await adapter.execute('INSERT INTO `users` SET ?', { name: 'Alice' });

  assert.deepEqual(pool.calls[0], { method: 'execute', sql: 'SELECT ?', values: [1] });
  assert.deepEqual(connection.calls[0], { method: 'execute', sql: 'SELECT ?', values: [2] });
  assert.deepEqual(pool.calls[1], { method: 'query', sql: 'SELECT 1', values: undefined });
  assert.deepEqual(pool.calls[2], {
    method: 'query',
    sql: 'INSERT INTO `users` SET ?',
    values: { name: 'Alice' },
  });
  assert.deepEqual(shown, [
    'SELECT 1',
    'SELECT 2',
    'SELECT 1',
    "INSERT INTO `users` SET `name` = 'Alice'",
  ]);
  assert.equal(adapter.package, 'mysql2');
});

test('transaction connections retain v1 release behavior', async () => {
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

  const acquired = await adapter.beginTransaction();
  assert.equal(acquired, connection);
  await adapter.commit(connection);
  await assert.rejects(adapter.rollback(connection), /rollback failed/);
  assert.deepEqual(events, ['begin', 'commit', 'release', 'rollback']);
});

test('a failed transaction start releases its checked-out connection', async () => {
  let released = false;
  const connection = asConnection({
    async beginTransaction() {
      throw new Error('begin failed');
    },
    release() {
      released = true;
    },
  });
  const pool = createPool([], async () => connection);
  const adapter = new MySQLAdapter({ pool });

  await assert.rejects(adapter.beginTransaction(), /begin failed/);
  assert.equal(released, true);
});

test('insert reads back the generated row and update rejects stale records', async () => {
  const pool = createPool([
    { affectedRows: 1, insertId: 4 },
    [{ user_id: 4, name: 'Alice' }],
    { affectedRows: 0, insertId: 0 },
  ]);
  const adapter = new MySQLAdapter({ pool });
  const toshihiko = new Toshihiko(adapter);
  const User = toshihiko.define('users', [
    { name: 'id', column: 'user_id', type: Type.Integer, primaryKey: true, autoIncrement: true },
    { name: 'name', type: Type.String },
  ]);

  const inserted = await adapter.insert(User, null, [
    { field: User.fieldNamesMap.name, value: 'Alice' },
  ]);
  assert.deepEqual({ ...inserted }, { id: 4, name: 'Alice' });
  assert.deepEqual(pool.calls[0], {
    method: 'execute',
    sql: 'INSERT INTO `users` SET `name` = ?',
    values: ['Alice'],
  });
  assert.deepEqual(pool.calls[1], {
    method: 'execute',
    sql: 'SELECT `user_id`, `name` FROM `users` WHERE (`user_id` = ?) LIMIT 0, 1',
    values: [4],
  });

  await assert.rejects(
    adapter.update(User, null, { id: 4 }, [
      { field: User.fieldNamesMap.name, value: 'Alice' },
    ]),
    /Out-dated yukari data/,
  );
});

test('insert preserves v1 empty-locator readback behavior', async () => {
  const pool = createPool([
    { affectedRows: 1, insertId: 0 },
    [{ id: 9, name: 'First row' }],
  ]);
  const adapter = new MySQLAdapter({ pool });
  const toshihiko = new Toshihiko(adapter);
  const User = toshihiko.define('users', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
  ]);

  assert.deepEqual({ ...await adapter.insert(User, null, [
    { field: User.fieldNamesMap.name, value: 'Alice' },
  ]) }, { id: 9, name: 'First row' });
  assert.deepEqual(pool.calls[1], {
    method: 'execute',
    sql: 'SELECT `id`, `name` FROM `users` LIMIT 0, 1',
    values: [],
  });
});

test('boolean showSql, connection events, formatting, and rollback keep v1 behavior', async () => {
  const pool = createPool([[{ ok: 1 }]]);
  let onConnection: (() => void) | undefined;
  pool.on = ((event: string, listener: () => void) => {
    if (event === 'connection') onConnection = listener;
    return pool;
  }) as typeof pool.on;
  const loggedSql: string[] = [];
  const previousLog = console.log;
  console.log = (sql) => loggedSql.push(String(sql));
  try {
    const adapter = new MySQLAdapter({ pool, showSql: true });
    const events: string[] = [];
    adapter.on('log', (message) => events.push(String(message)));
    onConnection?.();
    await adapter.execute('SELECT ?', [1]);
    assert.deepEqual(loggedSql, ['SELECT 1']);
    assert.equal(events.length, 1);
    assert.equal(adapter.format('SELECT 1'), 'SELECT 1');
    assert.equal(adapter.format('SELECT ?', [2]), 'SELECT 2');
    assert.equal(typeof adapter.options.showSql, 'function');

    const transactionEvents: string[] = [];
    const connection = asConnection({
      async rollback() { transactionEvents.push('rollback'); },
      release() { transactionEvents.push('release'); },
    });
    await adapter.rollback(connection);
    assert.deepEqual(transactionEvents, ['rollback', 'release']);
  } finally {
    console.log = previousLog;
  }
});

test('findWithCache restores requested fields when the primary query fails', async () => {
  const adapter = new MySQLAdapter({ pool: createPool() });
  const User = new Toshihiko(adapter).define('users', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
  ]);
  const options = { fields: ['name'] };
  const failure = new Error('primary query failed');
  adapter.findWithNoCache = async () => { throw failure; };
  const cache = {
    async deleteData() {},
    async deleteKeys() {},
    async getData() { return []; },
    async setData() {},
  };

  await assert.rejects(adapter.findWithCache(cache, User, options), (error) => error === failure);
  assert.deepEqual(options.fields, ['name', 'id']);
});

test('legacy SQL helper methods remain public Adapter delegates', () => {
  const adapter = new MySQLAdapter({ pool: createPool() });
  const User = new Toshihiko(adapter).define('users', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
  ]);

  assert.equal(adapter.makeFieldWhere(User, 'id', 1), '`id` = 1');
  assert.equal(adapter.makeArrayWhere(User, [{ id: 1 }]), '((`id` = 1))');
  assert.equal(adapter.makeWhere(User, { id: 1 }), '(`id` = 1)');
  assert.equal(adapter.makeOrder(User, [{ id: -1 }]), '`id` DESC');
  assert.equal(adapter.makeLimit(User, [0, 1]), '0, 1');
  assert.equal(adapter.makeIndex(User, 'PRIMARY'), 'FORCE INDEX(`PRIMARY`)');
  assert.equal(adapter.makeSet(User, { name: 'Alice' }), "`name` = 'Alice'");
  assert.equal(adapter.makeFind(User), 'SELECT * FROM `users`');
  assert.equal(
    adapter.makeUpdate(User, { update: { name: 'Alice' } }),
    "UPDATE `users` SET `name` = 'Alice'",
  );
  assert.equal(adapter.makeDelete(User), 'DELETE FROM `users`');
});

test('empty driver and cache result shapes retain v1 fallbacks', async () => {
  const defaultAdapter = new MySQLAdapter();
  await defaultAdapter.mysql.end();

  const adapter = new MySQLAdapter({ pool: createPool() });
  const User = new Toshihiko(adapter).define('users', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
  ]);
  adapter.execute = async () => null as never;
  assert.deepEqual(await adapter.findWithNoCache(User), []);
  await assert.rejects(adapter.insert(User, null, []), /no row inserted/);

  const cachedAdapter = new MySQLAdapter({ pool: createPool() });
  const cacheWrites: object[] = [];
  const cache = {
    async deleteData() {},
    async deleteKeys() {},
    async getData() { return [null, null]; },
    async setData(_database: string, _table: string, _key: object, row: object) {
      cacheWrites.push(row);
    },
  };
  const CachedUser = new Toshihiko(cachedAdapter).define('cached_users', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
  ], { cache });
  let primaryLookup = true;
  cachedAdapter.findWithNoCache = async (_model, options) => {
    if (primaryLookup) {
      primaryLookup = false;
      return [{ id: 1 }, { id: 2 }];
    }
    return options?.where?.id === 1 ? { id: 1, name: 'Alice' } : null;
  };
  assert.deepEqual(await cachedAdapter.findWithCache(cache, CachedUser, { single: true }), {
    id: 1,
    name: 'Alice',
  });
  assert.deepEqual(cacheWrites, [{ id: 1, name: 'Alice' }]);
  cachedAdapter.findWithNoCache = async () => [];
  assert.equal(await cachedAdapter.findWithCache(cache, CachedUser, { single: true }), null);

  const connection = createConnection([[{ connected: true }]]);
  assert.deepEqual(
    await new MySQLAdapter({ pool: createPool() }).execute(connection, 'SELECT 1'),
    [{ connected: true }],
  );
});

test('cache invalidation accepts null related rows', async () => {
  const deleted: readonly object[][] = [];
  const cache = {
    async deleteData() {},
    async deleteKeys(_database: string, _table: string, keys: readonly object[]) {
      (deleted as object[][]).push([...keys]);
    },
    async getData() { return []; },
    async setData() {},
  };
  const adapter = new MySQLAdapter({ pool: createPool() });
  const User = new Toshihiko(adapter).define('users', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
  ], { cache });
  adapter.findWithNoCache = async () => ({ id: 1 });
  adapter.execute = async () => ({ affectedRows: 1 }) as never;

  assert.equal((await adapter.update(User, null, { id: 1 }, [
    { field: User.fieldNamesMap.name, value: 'Alice' },
  ])).affectedRows, 1);

  adapter.findWithNoCache = async () => null;
  assert.equal((await adapter.update(User, null, { id: 2 }, [
    { field: User.fieldNamesMap.name, value: 'Carol' },
  ])).affectedRows, 1);

  const query = User.where({ id: 1 });
  adapter.findWithNoCache = async () => ({ id: 1 });
  assert.equal((await query.update({ name: 'Bob' })).affectedRows, 1);
  adapter.findWithNoCache = async () => null;
  const nullRelatedQuery = User.where({ id: 2 });
  assert.equal((await nullRelatedQuery.update({ name: 'Dave' })).affectedRows, 1);
  assert.deepEqual(deleted, [[{ id: 1 }], [], [{ id: 1 }], []]);
});
