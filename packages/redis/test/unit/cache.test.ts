import assert from 'node:assert/strict';
import test from 'node:test';
import type RedisClient from 'ioredis';
import { create, RedisCache } from '../../dist';

test('Redis cache preserves v1 key and round-trip result shapes', async () => {
  let pipelineResult: readonly (readonly [Error | null, unknown])[] | null = [];
  const operations: string[][] = [];
  const client = {
    async del(key: string) {
      operations.push(['del', key]);
      return 1;
    },
    pipeline() {
      const pipeline = {
        del(key: string) {
          operations.push(['pipeline.del', key]);
          return pipeline;
        },
        async exec() {
          return pipelineResult;
        },
        get(key: string) {
          operations.push(['pipeline.get', key]);
          return pipeline;
        },
      };
      return pipeline;
    },
    async set(key: string, value: string) {
      operations.push(['set', key, value]);
      return 'OK';
    },
  } as unknown as RedisClient;
  const cache = new RedisCache('127.0.0.1:6379', { prefix: '__test__' }, client);

  assert.equal(cache._getKey('database', 'records', 1), '__test__database_records:1');
  assert.equal(cache._getKey('database', 'records', null), '__test__database_records');
  assert.equal(
    cache._getKey('database', 'records', { siteId: 1, userId: 2 }),
    '__test__database_records:siteId1:userId2',
  );
  assert.equal(await cache.setData('database', 'records', 1, { id: 1 }), 'OK');
  assert.deepEqual(operations.at(-1), [
    'set',
    '__test__database_records:1',
    '{"id":1}',
  ]);

  pipelineResult = [
    [null, null],
    [null, '{"id":2}'],
  ];
  assert.deepEqual(
    await cache.getData('database', 'records', [1, 2]),
    [null, { id: 2 }],
  );

  pipelineResult = [
    [null, 1],
    [null, 0],
  ];
  assert.deepEqual(
    await cache.deleteKeys('database', 'records', [1, 2]),
    [1, 0],
  );
  assert.equal(await cache.deleteData('database', 'records', 1), 1);

  pipelineResult = null;
  assert.deepEqual(await cache.getData('database', 'records', 1), []);
  assert.deepEqual(await cache.deleteKeys('database', 'records', [1]), []);

  const withoutOptions = new RedisCache('127.0.0.1:6379', undefined, client);
  assert.equal(withoutOptions.prefix, '');
  assert.equal(withoutOptions._getKey('database', 'records', 1), 'database_records:1');
});

test('Redis cache create constructs a lazy client with v1 server parsing', () => {
  const cache = create('127.0.0.1:6379', {
    lazyConnect: true,
    prefix: '__created__',
  });

  assert.equal(cache.prefix, '__created__');
  assert.equal(cache._getKey('database', 'records', 1), '__created__database_records:1');
  cache.redis.disconnect();

  const defaults = create('127.0.0.1:6379');
  defaults.redis.disconnect();
});
