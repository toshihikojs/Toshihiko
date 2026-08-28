import assert from 'node:assert/strict';
import test from 'node:test';
import { MemcachedCache } from '../../dist';

test('Memcached cache preserves the v1 service-backed contract', async () => {
  const prefix = `__toshihiko_v2_${process.pid}__`;
  const cache = new MemcachedCache(
    `${process.env.MEMCACHED_HOST ?? '127.0.0.1'}:${process.env.MEMCACHED_PORT ?? '11211'}`,
    { prefix },
  );
  const first = { id: 1, name: 'first' };
  const second = { id: 2, name: 'second' };

  try {
    assert.equal(
      cache._getKey('database', 'records', { siteId: 1, userId: 2 }),
      `${prefix}database:records:s1:u2`,
    );
    assert.equal(await cache.setData('database', 'records', 1, first), true);
    assert.equal(await cache.setData('database', 'records', 2, second), true);
    assert.deepEqual(await cache.getData('database', 'records', [1, 2]), [first, second]);
    assert.deepEqual(await cache.getData('database', 'records', [999, 2]), [second]);
    assert.equal(await cache.deleteData('database', 'records', 1), true);
    assert.deepEqual(await cache.getData('database', 'records', [1]), []);
    await cache.deleteKeys('database', 'records', [2]);
    assert.deepEqual(await cache.getData('database', 'records', [2]), []);
  } finally {
    cache.memcached.end();
  }
});
