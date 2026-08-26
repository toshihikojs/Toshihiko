'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { format } = require('mysql2');

const { MySQLAdapter } = require('../../dist');
const { Toshihiko, Type } = require('toshihiko');

function createPool(results = []) {
  const calls = [];
  let resultIndex = 0;
  const pool = {
    calls,
    end: async () => undefined,
    format,
    getConnection: async () => {
      throw new Error('getConnection not configured');
    },
    on() {
      return this;
    },
    async query(sql, values) {
      calls.push({ sql, values });
      return [results[resultIndex++] ?? [], []];
    },
  };
  return pool;
}

test('find and count execute through the Promise pool without callbacks', async () => {
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
  assert.equal(await adapter.count(User.where({ id: { $gte: 2 } })), 3);
  assert.equal(pool.calls[0].sql, 'SELECT `user_id`, `name` FROM `users` WHERE (`user_id` = 1) LIMIT 0, 1');
  assert.equal(pool.calls[1].sql, 'SELECT COUNT(0) FROM `users` WHERE (`user_id` >= 2)');
});

test('execute preserves both v2 and legacy connection-first argument order', async () => {
  const pool = createPool([[{ ok: 1 }]]);
  const connectionCalls = [];
  const connection = {
    async query(sql, values) {
      connectionCalls.push({ sql, values });
      return [[{ connected: true }], []];
    },
  };
  const shown = [];
  const adapter = new MySQLAdapter({ pool, showSql: (sql) => shown.push(sql) });

  await adapter.execute('SELECT ?', [1]);
  await adapter.execute(connection, 'SELECT ?', [2]);

  assert.deepEqual(pool.calls[0], { sql: 'SELECT ?', values: [1] });
  assert.deepEqual(connectionCalls[0], { sql: 'SELECT ?', values: [2] });
  assert.deepEqual(shown, ['SELECT 1', 'SELECT 2']);
});

test('transaction connections are released on success and failure', async () => {
  const events = [];
  const connection = {
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
  };
  const pool = createPool();
  pool.getConnection = async () => connection;
  const adapter = new MySQLAdapter({ pool });

  const acquired = await adapter.beginTransaction();
  assert.equal(acquired, connection);
  await adapter.commit(connection);
  await assert.rejects(adapter.rollback(connection), /rollback failed/);
  assert.deepEqual(events, ['begin', 'commit', 'release', 'rollback', 'release']);
});

test('a failed transaction start releases its checked-out connection', async () => {
  let released = false;
  const connection = {
    async beginTransaction() {
      throw new Error('begin failed');
    },
    release() {
      released = true;
    },
  };
  const pool = createPool();
  pool.getConnection = async () => connection;
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
  assert.deepEqual(inserted, { user_id: 4, name: 'Alice' });
  assert.equal(pool.calls[0].sql, "INSERT INTO `users` SET `name` = 'Alice'");
  assert.equal(pool.calls[1].sql, 'SELECT `user_id`, `name` FROM `users` WHERE (`user_id` = 4) LIMIT 0, 1');

  await assert.rejects(
    adapter.update(User, null, { id: 4 }, [
      { field: User.fieldNamesMap.name, value: 'Alice' },
    ]),
    /Out-dated yukari data/,
  );
});

test('insert refuses an ambiguous readback instead of returning the first row', async () => {
  const pool = createPool([{ affectedRows: 1, insertId: 0 }]);
  const adapter = new MySQLAdapter({ pool });
  const toshihiko = new Toshihiko(adapter);
  const User = toshihiko.define('users', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
  ]);

  await assert.rejects(
    adapter.insert(User, null, [
      { field: User.fieldNamesMap.name, value: 'Alice' },
    ]),
    /no unique readback condition/,
  );
  assert.equal(pool.calls.length, 1);
});
