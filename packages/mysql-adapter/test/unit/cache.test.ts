import assert from 'node:assert/strict';
import test from 'node:test';
import type { Cache, CacheKey } from 'toshihiko';
import { Type } from 'toshihiko';
import { MySQLAdapter } from '../../dist';
import {
  createPool,
  dataFor,
  define,
} from '../helpers/mysql';

class TestCache implements Cache<unknown> {
  readonly deleted: CacheKey[][] = [];
  readonly reads: CacheKey[][] = [];
  readonly writes: { readonly data: unknown; readonly key: CacheKey }[] = [];
  getError: Error | undefined;
  deleteError: Error | undefined;
  setError: Error | undefined;
  rows: unknown[] = [];

  async deleteData(): Promise<void> {}

  async deleteKeys(
    _database: string,
    _table: string,
    keys: readonly CacheKey[],
  ): Promise<void> {
    this.deleted.push([...keys]);
    if (this.deleteError) throw this.deleteError;
  }

  async getData(
    _database: string,
    _table: string,
    keys: CacheKey | readonly CacheKey[],
  ): Promise<unknown[]> {
    this.reads.push(Array.isArray(keys) ? [...keys] : [keys]);
    if (this.getError) throw this.getError;
    return this.rows;
  }

  async setData(
    _database: string,
    _table: string,
    key: CacheKey,
    data: unknown,
  ): Promise<void> {
    this.writes.push({ data, key });
    if (this.setError) throw this.setError;
  }
}

test('v1 MySQL cache reads hits, fills misses, and honors noCache', async () => {
  const cache = new TestCache();
  cache.rows = [{ user_id: 1, name: 'cached', ignored: 'cached-extra' }];
  const pool = createPool([
    [{ user_id: 1 }, { user_id: 2 }],
    [{ user_id: 2, name: 'database', ignored: 'database-extra' }],
    [{ user_id: 3, name: 'direct', ignored: 'direct-extra' }],
  ]);
  const adapter = new MySQLAdapter({ database: 'cache_test', pool });
  const User = define(adapter, 'users', [
    { name: 'id', column: 'user_id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
    { name: 'ignored', type: Type.String },
  ], { cache });

  const rows = await User.fields(['id', 'name']).find();
  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.name, 'cached');
  assert.equal(rows[0]?.$fromCache, true);
  assert.equal(rows[0]?.ignored, undefined);
  assert.equal(rows[1]?.name, 'database');
  assert.equal(rows[1]?.$fromCache, false);
  assert.equal(rows[1]?.ignored, undefined);
  assert.deepEqual(cache.reads, [[{ user_id: 1 }, { user_id: 2 }]]);
  assert.deepEqual(cache.writes, [{
    data: { user_id: 2, name: 'database' },
    key: { user_id: 2 },
  }]);

  const direct = await User.where({ id: 3 }).find({ noCache: true });
  assert.equal(direct[0]?.name, 'direct');
  assert.equal(cache.reads.length, 1);
});

test('v1 MySQL cache read failures fall back to database rows', async () => {
  const cache = new TestCache();
  cache.getError = new Error('cache unavailable');
  const pool = createPool([
    [{ id: 1 }],
    [{ id: 1, name: 'database' }],
  ]);
  const adapter = new MySQLAdapter({ pool });
  const User = define(adapter, 'users', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
  ], { cache });

  const rows = await User.find();
  assert.equal(rows[0]?.name, 'database');
  assert.equal(cache.writes.length, 1);
});

test('v1 MySQL cache write failures do not fail database reads', async () => {
  const cache = new TestCache();
  cache.setError = new Error('cache write failed');
  const pool = createPool([
    [{ id: 1 }],
    [{ id: 1, name: 'database' }],
  ]);
  const adapter = new MySQLAdapter({ pool });
  const User = define(adapter, 'users', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
  ], { cache });

  const rows = await User.find();
  assert.equal(rows[0]?.name, 'database');
  assert.equal(pool.calls.length, 2);
});

test('v1 MySQL cache misses finish every database fetch before rejecting', async () => {
  const cache = new TestCache();
  const firstError = new Error('first database failure');
  const pool = createPool([
    [{ id: 1 }, { id: 2 }],
    firstError,
    new Error('second database failure'),
  ]);
  const adapter = new MySQLAdapter({ pool });
  const User = define(adapter, 'users', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
  ], { cache });

  await assert.rejects(User.find(), firstError);
  assert.equal(pool.calls.length, 3);
});

test('v1 MySQL mutations invalidate matching keys before writing', async () => {
  const cache = new TestCache();
  const pool = createPool([
    [{ user_id: 1 }],
    { affectedRows: 1 },
    [{ user_id: 2 }],
    { affectedRows: 1 },
    [{ user_id: 3 }],
    { affectedRows: 1 },
  ]);
  const adapter = new MySQLAdapter({ pool });
  const User = define(adapter, 'users', [
    { name: 'id', column: 'user_id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
  ], { cache });

  await User.where({ id: 1 }).update({ name: 'updated' });
  await User.where({ id: 2 }).delete();
  await adapter.update(
    User,
    null,
    { id: 3 },
    dataFor(User, { name: 'saved' }),
  );
  assert.deepEqual(cache.deleted, [
    [{ user_id: 1 }],
    [{ user_id: 2 }],
    [{ user_id: 3 }],
  ]);
  assert.match(pool.calls[0]!.sql, /^SELECT `user_id` FROM `users`/);
  assert.match(pool.calls[1]!.sql, /^UPDATE `users`/);
  assert.match(pool.calls[2]!.sql, /^SELECT `user_id` FROM `users`/);
  assert.match(pool.calls[3]!.sql, /^DELETE FROM `users`/);
  assert.match(pool.calls[4]!.sql, /^SELECT `user_id` FROM `users`/);
  assert.match(pool.calls[5]!.sql, /^UPDATE `users`/);
});

test('v1 MySQL cache invalidation failures prevent mutations', async () => {
  const cache = new TestCache();
  cache.deleteError = new Error('cache delete failed');
  const pool = createPool([[{ id: 1 }]]);
  const adapter = new MySQLAdapter({ pool });
  const User = define(adapter, 'users', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name', type: Type.String },
  ], { cache });

  await assert.rejects(
    User.where({ id: 1 }).update({ name: 'updated' }),
    /cache delete failed/,
  );
  assert.equal(pool.calls.length, 1);
});
