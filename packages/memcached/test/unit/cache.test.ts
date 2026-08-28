import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import type MemcachedClient from 'memcached';
import { MemcachedCache } from '../../dist';

class FakeMemcached extends EventEmitter {
  readonly values = new Map<string, unknown>();

  del(key: string, callback: (error?: Error) => void): void {
    this.values.delete(key);
    callback();
  }

  get(key: string, callback: (error: Error | undefined, value?: unknown) => void): void {
    callback(undefined, this.values.get(key));
  }

  getMulti(
    keys: readonly string[],
    callback: (error: Error | undefined, values: Record<string, unknown>) => void,
  ): void {
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
    callback();
  }
}

test('Memcached cache preserves v1 key generation and data behavior', async () => {
  const client = new FakeMemcached();
  const cache = new MemcachedCache(
    '127.0.0.1:11211',
    { prefix: '__test__' },
    client as unknown as MemcachedClient,
  );

  assert.equal(cache._getKey('database', 'records', 1), '__test__database:records:1');
  assert.equal(cache._getKey('database', 'records', null), '__test__database:records');
  assert.equal(
    cache._getKey('database', 'records', { id: null }),
    '__test__database:records:null',
  );
  assert.equal(
    cache._getKey('database', 'records', { a: 2, b: 3 }),
    '__test__database:records:a2:b3',
  );
  assert.equal(
    cache._getKey('database', 'records', { aabd: 2, aac: 3 }),
    '__test__database:records:aab2:aac3',
  );
  assert.equal(cache._getKey('database', 'records', {}), '__test__database:records');

  assert.equal(await cache.setData('database', 'records', 1, { id: 1 }), true);
  assert.deepEqual(await cache.getData('database', 'records', 1), [{ id: 1 }]);
  assert.deepEqual(await cache.getData('database', 'records', [999, 1]), [{ id: 1 }]);
  assert.equal(await cache.deleteData('database', 'records', 1), true);
  assert.deepEqual(await cache.getData('database', 'records', 1), []);

  await cache.setData('database', 'records', 1, { id: 1 });
  await cache.setData('database', 'records', 2, { id: 2 });
  await cache.deleteKeys('database', 'records', [1, 2]);
  assert.deepEqual(await cache.getData('database', 'records', [1, 2]), []);
});

test('Memcached cache forwards connection events and custom key functions', () => {
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
  assert.equal(cache._getKey('db', 'table', 1), ':dbtable1');
});
