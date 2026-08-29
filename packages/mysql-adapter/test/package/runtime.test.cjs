'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { format } = require('mysql2');

const { MySQLAdapter } = require('../..');
const { Adapter, Toshihiko, Type } = require('toshihiko');

test('the v1 mysql dialect name resolves the scoped adapter package', () => {
  const pool = {
    format,
    on() {
      return this;
    },
  };
  const toshihiko = new Toshihiko('mysql', { pool, database: 'package' });

  assert.equal(Adapter.mysql, MySQLAdapter);
  assert.equal('adapter' in toshihiko, false);
  assert.equal(toshihiko.pool, pool);
  assert.equal(toshihiko.database, 'package');
});

test('published package connects directly to Toshihiko and hydrates rows', async () => {
  const queries = [];
  const pool = {
    end: async () => undefined,
    format,
    getConnection: async () => {
      throw new Error('unused');
    },
    on() {
      return this;
    },
    async execute(sql, values) {
      queries.push({ sql, values });
      return [[{ user_id: '7', display_name: 'Alice' }], []];
    },
  };
  const toshihiko = new Toshihiko(MySQLAdapter, { pool, database: 'package' });
  const User = toshihiko.define('users', [
    { name: 'id', column: 'user_id', type: Type.Integer, primaryKey: true },
    { name: 'name', column: 'display_name', type: Type.String },
  ]);

  const user = await User.findOne(true);
  assert.deepEqual(user, { id: 7, name: 'Alice' });
  assert.deepEqual(queries[0], {
    sql: 'SELECT `user_id`, `display_name` FROM `users` LIMIT 0, 1',
    values: [],
  });
});
