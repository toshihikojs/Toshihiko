'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { Cache } = require('../..');

class MemoryCache extends Cache {
  async deleteData() {}

  async deleteKeys() {}

  async getData() {
    return [{ id: 1 }];
  }

  async setData() {}
}

test('published Cache is an event emitter and satisfies the cache contract', async () => {
  const cache = new MemoryCache();
  let detail;
  cache.on('failure', (value) => { detail = value; });
  cache.emit('failure', 'unavailable');

  assert.equal(detail, 'unavailable');
  assert.deepEqual(await cache.getData('database', 'records', [1]), [{ id: 1 }]);
});
