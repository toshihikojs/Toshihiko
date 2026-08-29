import assert from 'node:assert/strict';
import test from 'node:test';
import { RedisCache } from '../../dist';

test('Redis cache preserves the v1 service-backed contract', async () => {
  const prefix = `__toshihiko_v2_${process.pid}__`;
  const cache = new RedisCache(
    `${process.env.REDIS_HOST ?? '127.0.0.1'}:${process.env.REDIS_PORT ?? '6379'}`,
    { prefix },
  );
  const first = { id: 1, name: 'first' };
  const second = { id: 2, name: 'second' };

  try {
    const composite = { siteId: 1, userId: 2 };
    await cache.setData('database', 'records', composite, first);
    assert.deepEqual(await cache.getData('database', 'records', composite), [first]);
    assert.equal(await cache.setData('database', 'records', 1, first), 'OK');
    assert.equal(await cache.setData('database', 'records', 2, second), 'OK');
    assert.deepEqual(await cache.getData('database', 'records', [1, 2]), [first, second]);
    assert.deepEqual(await cache.getData('database', 'records', [999, 2]), [null, second]);
    assert.equal(await cache.deleteData('database', 'records', 1), 1);
    assert.deepEqual(await cache.getData('database', 'records', [1]), [null]);
    assert.deepEqual(await cache.deleteKeys('database', 'records', [2]), [1]);
    assert.deepEqual(await cache.getData('database', 'records', [2]), [null]);
  } finally {
    cache.redis.disconnect();
  }
});
