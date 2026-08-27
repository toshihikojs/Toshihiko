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
  assert.equal(await adapter.count(User.where({ id: { $gte: 2 } })), 3);
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
  assert.deepEqual(inserted, { user_id: 4, name: 'Alice' });
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

  assert.deepEqual(await adapter.insert(User, null, [
    { field: User.fieldNamesMap.name, value: 'Alice' },
  ]), { id: 9, name: 'First row' });
  assert.deepEqual(pool.calls[1], {
    method: 'execute',
    sql: 'SELECT `id`, `name` FROM `users` LIMIT 0, 1',
    values: [],
  });
});
