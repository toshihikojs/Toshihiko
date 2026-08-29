import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import type MemcachedClient from 'memcached';
import { create, MemcachedCache } from '../../dist';

class FakeMemcached extends EventEmitter {
  delError: Error | undefined;
  getError: Error | undefined;
  getMultiError: Error | undefined;
  setError: Error | undefined;
  readonly multiCalls: string[][] = [];
  readonly values = new Map<string, unknown>();

  del(key: string, callback: (error?: Error) => void): void {
    this.values.delete(key);
    callback(this.delError);
  }

  get(key: string, callback: (error: Error | undefined, value?: unknown) => void): void {
    callback(this.getError, this.values.get(key));
  }

  getMulti(
    keys: readonly string[],
    callback: (error: Error | undefined, values: Record<string, unknown>) => void,
  ): void {
    this.multiCalls.push([...keys]);
    if (this.getMultiError) {
      callback(this.getMultiError, {});
      return;
    }
    const values: Record<string, unknown> = {};
    for (const key of keys) {
      if (this.values.has(key)) values[key] = this.values.get(key);
    }
    callback(undefined, values);
  }

  set(
    key: string,
    value: unknown,
    lifetime: number,
    callback: (error?: Error) => void,
  ): void {
    assert.equal(lifetime, 0);
    this.values.set(key, value);
    callback(this.setError);
  }
}

test('Memcached cache preserves v1 key generation and data behavior', async () => {
  const client = new FakeMemcached();
  const cache = new MemcachedCache(
    '127.0.0.1:11211',
    { prefix: '__test__' },
    client as unknown as MemcachedClient,
  );

  assert.equal(await cache.setData('database', 'records', 1, { id: 1 }), true);
  assert.equal(client.values.has('__test__database:records:1'), true);
  await cache.setData('database', 'records', null, { id: 0 });
  assert.equal(client.values.has('__test__database:records'), true);
  await cache.setData('database', 'records', { id: null }, { id: 2 });
  assert.equal(client.values.has('__test__database:records:null'), true);
  await cache.setData('database', 'records', { a: 2, b: 3 }, { id: 3 });
  assert.equal(client.values.has('__test__database:records:a2:b3'), true);
  await cache.setData('database', 'records', { aabd: 2, aac: 3 }, { id: 4 });
  assert.equal(client.values.has('__test__database:records:aab2:aac3'), true);
  await cache.setData('database', 'records', { ab: 2, abc: 3 }, { id: 5 });
  assert.equal(client.values.has('__test__database:records:ab2:abc3'), true);
  await cache.setData('database', 'records', {}, { id: 6 });
  assert.deepEqual(client.values.get('__test__database:records'), { id: 6 });
  assert.deepEqual(await cache.getData('database', 'records', 1), [{ id: 1 }]);
  assert.deepEqual(await cache.getData('database', 'records', [999, 1]), [{ id: 1 }]);
  assert.equal(await cache.deleteData('database', 'records', 1), true);
  assert.deepEqual(await cache.getData('database', 'records', 1), []);

  await cache.setData('database', 'records', 1, { id: 1 });
  await cache.setData('database', 'records', 2, { id: 2 });
  await cache.deleteKeys('database', 'records', [1, 2]);
  assert.deepEqual(await cache.getData('database', 'records', [1, 2]), []);

  const longKey1 = `a${'x'.repeat(125)}`;
  const longKey2 = `b${'y'.repeat(125)}`;
  await cache.setData('database', 'records', longKey1, { id: 1 });
  await cache.setData('database', 'records', longKey2, { id: 2 });
  assert.deepEqual(
    await cache.getData('database', 'records', [longKey1, longKey2]),
    [{ id: 1 }, { id: 2 }],
  );
  assert.equal(client.multiCalls.length >= 2, true);

  client.getMultiError = new Error('getMulti failed');
  await assert.rejects(
    cache.getData('database', 'records', [1, 2]),
    /getMulti failed/,
  );

  assert.deepEqual(await cache.getData('database', 'records', []), []);
  client.getError = new Error('get failed');
  await assert.rejects(cache.getData('database', 'records', 1), /get failed/);
  client.getError = undefined;
  client.setError = new Error('set failed');
  await assert.rejects(cache.setData('database', 'records', 3, { id: 3 }), /set failed/);
  client.setError = undefined;
  client.delError = new Error('delete failed');
  await assert.rejects(cache.deleteData('database', 'records', 3), /delete failed/);
});

test('Memcached cache forwards connection events and custom key functions', async () => {
  const client = new FakeMemcached();
  const cache = new MemcachedCache(
    '127.0.0.1:11211',
    {},
    client as unknown as MemcachedClient,
  );
  let failure;
  let reconnecting;
  cache.on('failure', (details) => { failure = details; });
  cache.on('reconnecting', (details) => { reconnecting = details; });
  client.emit('failure', 'failed');
  client.emit('reconnecting', 'retrying');
  assert.equal(failure, 'failed');
  assert.equal(reconnecting, 'retrying');

  cache.setCustomizeKeyFunc(function(database, table, key) {
    return `:${database}${table}${String(key)}`;
  });
  await cache.setData('db', 'table', 1, { id: 1 });
  assert.equal(client.values.has(':dbtable1'), true);
});

test('Memcached cache constructor option and create helper retain the v1 surface', async () => {
  const client = new FakeMemcached();
  const customized = new MemcachedCache(
    '127.0.0.1:11211',
    {
      customizeKey(database, table, key) {
        return `${database}/${table}/${String(key)}`;
      },
    },
    client as unknown as MemcachedClient,
  );
  await customized.setData('db', 'table', 1, { id: 1 });
  assert.equal(client.values.has('db/table/1'), true);

  const cache = create('127.0.0.1:11211');
  assert.equal(cache.servers, '127.0.0.1:11211');
  cache.memcached.end();
});
