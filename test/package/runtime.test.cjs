'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { Toshihiko, Type } = require('../..');
const { Yukari } = require('../../dist/yukari.js');

class MemoryAdapter {
  constructor(options) {
    this.options = options;
    this.calls = [];
  }

  getDBName() {
    return this.options.database;
  }

  async find(query, options) {
    this.calls.push({
      connection: query._conn,
      fields: [...query._fields],
      index: query._index,
      limit: [...query._limit],
      options,
      order: query._order,
      table: query.model.name,
      where: query._where,
    });

    const rows = this.options.rows;
    return options.single ? rows[0] ?? null : rows;
  }
}

test('define compiles the documented schema into model metadata', () => {
  const toshihiko = new Toshihiko('mysql', { database: 'toshihiko' });
  const User = toshihiko.define('user', [
    {
      name: 'id',
      column: 'user_id',
      type: Type.Integer,
      primaryKey: true,
      autoIncrement: true,
    },
    { name: 'username', type: Type.String, default: 'anonymous' },
    { name: 'nickname' },
  ]);

  assert.equal(User.name, 'user');
  assert.equal(User.parent, toshihiko);
  assert.deepEqual(User.nameToColumn, {
    id: 'user_id',
    username: 'username',
    nickname: 'nickname',
  });
  assert.deepEqual(User.columnToName, {
    user_id: 'id',
    username: 'username',
    nickname: 'nickname',
  });
  assert.deepEqual(User.primaryKeys.map((field) => field.name), ['id']);
  assert.equal(User.autoIncrementField?.name, 'id');
  assert.equal(User.ai, User.autoIncrementField);
  assert.equal(User.fieldNamesMap.nickname.type, Type.String);
  assert.equal(User.fieldNamesMap.nickname.defaultValue, '');
  assert.equal(User.fieldNamesMap.username.defaultValue, 'anonymous');
});

test('define keeps model-local options without interpreting infrastructure', () => {
  const toshihiko = new Toshihiko('mysql');
  const cache = { name: 'memcached' };
  const User = toshihiko.define('user', [{ name: 'id' }], { cache });

  assert.equal(User.options.cache, cache);
});

test('define rejects fields without logical names', () => {
  const toshihiko = new Toshihiko('mysql');

  assert.throws(
    () => toshihiko.define('user', [{}]),
    /no field name specified/,
  );
});

test('define rejects callback validators', () => {
  const toshihiko = new Toshihiko('mysql');

  assert.throws(
    () => toshihiko.define('user', [{
      name: 'id',
      type: Type.Integer,
      validators(value, callback) {
        callback(value < 0 ? new Error('invalid id') : undefined);
      },
    }]),
    /callback validators are not supported/,
  );
});

test('define rejects non-function validators from JavaScript callers', () => {
  const toshihiko = new Toshihiko('mysql');

  assert.throws(
    () => toshihiko.define('user', [{ name: 'id', validators: 'required' }]),
    /validators must be functions that return Promises/,
  );
});

test('build creates a new Yukari and clones field defaults', () => {
  const toshihiko = new Toshihiko('mysql');
  const User = toshihiko.define('user', [
    { name: 'id', type: Type.Integer },
    { name: 'name', type: Type.String, default: 'anonymous' },
    { name: 'settings', type: Type.Json },
    { name: 'birthday', type: Type.Datetime, allowNull: true },
  ]);

  const first = User.build({ id: 1, birthday: null, ignored: true });
  const second = User.build({ id: 2 });

  assert.equal(first.$model, User);
  assert.equal(first.$source, 'new');
  assert.equal(first.id, 1);
  assert.equal(first.name, 'anonymous');
  assert.equal(first.birthday, null);
  assert.equal(first.ignored, undefined);
  assert.deepEqual(first.settings, {});
  assert.deepEqual(second.settings, {});
  assert.notEqual(first.settings, second.settings);
  assert.deepEqual(Object.keys(first), ['id', 'name', 'settings', 'birthday']);
});

test('Yukari validation is Promise-only and runs validators in order', async () => {
  const calls = [];
  const toshihiko = new Toshihiko('mysql');
  const User = toshihiko.define('user', [{
    name: 'score',
    type: Type.Integer,
    validators: [
      async function lowerBound(value) {
        calls.push(`lower:${value}:${this === User}`);
        if (value < 0) return 'score is too small';
      },
      async function upperBound(value) {
        calls.push(`upper:${value}:${this === User}`);
        if (value > 100) return 'score is too large';
      },
    ],
  }]);

  await User.build({ score: 50 }).validateAll();
  assert.deepEqual(calls, ['lower:50:true', 'upper:50:true']);

  await assert.rejects(
    User.build({ score: -1 }).validateAll(),
    /score is too small/,
  );
});

test('Yukari validation rejects nulls and synchronous validators', async () => {
  const toshihiko = new Toshihiko('mysql');
  const User = toshihiko.define('user', [
    { name: 'name', type: Type.String, allowNull: false },
    { name: 'legacy', validators: () => 'invalid' },
  ]);

  await assert.rejects(
    User.build({ name: null }).validateAll(),
    /Field name can't be null/,
  );
  await assert.rejects(
    User.build({ legacy: 'value' }).validateAll(),
    /must return a Promise/,
  );
});

test('Yukari restores database columns without applying build defaults', () => {
  const toshihiko = new Toshihiko('mysql');
  const User = toshihiko.define('user', [
    { name: 'id', column: 'user_id', type: Type.Integer },
    { name: 'name', type: Type.String, default: 'anonymous' },
    { name: 'settings', type: Type.Json },
    {
      name: 'createdAt',
      column: 'created_at',
      type: Type.Datetime,
    },
  ]);
  const yukari = new Yukari(User, 'query');

  yukari.fillRowFromSource({
    user_id: '7',
    settings: '{"theme":"dark"}',
    created_at: '2026-08-26T01:02:03.000Z',
  }, true);

  assert.equal(yukari.id, 7);
  assert.equal(yukari.name, undefined);
  assert.deepEqual(yukari.settings, { theme: 'dark' });
  assert.equal(yukari.createdAt.toISOString(), '2026-08-26T01:02:03.000Z');
  assert.equal(yukari.fieldIndex('id'), 0);
  assert.equal(yukari.fieldIndex('name'), -1);
  assert.deepEqual(yukari.changes(), []);
});

test('Yukari serializes current and original rows and extracts changes', () => {
  const toshihiko = new Toshihiko('mysql');
  const User = toshihiko.define('user', [
    { name: 'id', column: 'user_id', type: Type.Integer },
    { name: 'settings', type: Type.Json },
    {
      name: 'createdAt',
      column: 'created_at',
      type: Type.Datetime,
      allowNull: true,
    },
  ]);
  const yukari = new Yukari(User, 'query');
  yukari.fillRowFromSource({
    user_id: '7',
    settings: '{"theme":"dark"}',
    created_at: '2026-08-26T01:02:03.000Z',
  }, true);

  yukari.id = 8;
  yukari.settings.theme = 'light';

  assert.deepEqual(yukari.toJSON(), {
    id: 8,
    settings: { theme: 'light' },
    createdAt: '2026-08-26T01:02:03.000Z',
  });
  assert.deepEqual(yukari.toJSON(true), {
    id: 7,
    settings: { theme: 'dark' },
    createdAt: '2026-08-26T01:02:03.000Z',
  });

  yukari.createdAt = null;
  assert.deepEqual(
    yukari.changes().map(({ field, value }) => ({ name: field.name, value })),
    [
      { name: 'id', value: 8 },
      { name: 'settings', value: { theme: 'light' } },
      { name: 'createdAt', value: null },
    ],
  );
  assert.deepEqual(
    Yukari.extractAdapterData(User, yukari).map(({ field, value }) => ({
      name: field.name,
      value,
    })),
    [
      { name: 'id', value: 8 },
      { name: 'settings', value: { theme: 'light' } },
      { name: 'createdAt', value: null },
    ],
  );
});

test('a Promise Adapter plugs directly into the original Model query API', async () => {
  const connection = { transaction: 1 };
  const toshihiko = new Toshihiko(MemoryAdapter, {
    database: 'toshihiko',
    rows: [
      { user_id: '7', user_name: 'Alice' },
      { user_id: '8', user_name: 'Bob' },
    ],
  });
  const User = toshihiko.define('user', [
    { name: 'id', column: 'user_id', type: Type.Integer, primaryKey: true },
    { name: 'name', column: 'user_name', type: Type.String },
  ]);

  const users = await User
    .where({ id: { $gte: 7 } })
    .fields('id, name')
    .index('PRIMARY')
    .orderBy({ id: 'desc' })
    .limit(2)
    .conn(connection)
    .find();

  assert.equal(toshihiko.database, 'toshihiko');
  assert.equal(toshihiko.adapter instanceof MemoryAdapter, true);
  assert.deepEqual(users.map((user) => user.toJSON()), [
    { id: 7, name: 'Alice' },
    { id: 8, name: 'Bob' },
  ]);
  assert.deepEqual(toshihiko.adapter.calls[0], {
    connection,
    fields: ['id', 'name'],
    index: 'PRIMARY',
    limit: [2],
    options: { noCache: false, single: false },
    order: [{ id: -1 }],
    table: 'user',
    where: { id: { $gte: 7 } },
  });

  const first = await User.findOne();
  assert.equal(first.id, 7);
  assert.deepEqual(toshihiko.adapter.calls[1].options, {
    noCache: false,
    single: true,
  });

  const json = await User.findById(7, true);
  assert.deepEqual(json, { id: 7, name: 'Alice' });
  assert.deepEqual(toshihiko.adapter.calls[2].where, { id: 7 });

  await User.order('id').find(false, { noCache: true });
  assert.deepEqual(toshihiko.adapter.calls[3].order, [{ id: 1 }]);
  assert.deepEqual(toshihiko.adapter.calls[3].options, {
    noCache: true,
    single: false,
  });
});

test('findById validates composite keys before invoking the Adapter', async () => {
  const adapter = new MemoryAdapter({ database: 'toshihiko', rows: [] });
  const toshihiko = new Toshihiko(adapter);
  const Membership = toshihiko.define('membership', [
    { name: 'userId', column: 'user_id', type: Type.Integer, primaryKey: true },
    { name: 'groupId', column: 'group_id', type: Type.Integer, primaryKey: true },
  ]);

  await Membership.findById({ userId: 1, groupId: 2 });
  assert.deepEqual(adapter.calls[0].where, { userId: 1, groupId: 2 });

  await assert.rejects(
    Membership.findById({ userId: 1 }),
    /missing primary key groupId/,
  );
  assert.equal(adapter.calls.length, 1);
});

test('v2 rejects unresolved, callback, and synchronous Adapters clearly', async () => {
  const unresolved = new Toshihiko('mysql');
  const User = unresolved.define('user', [
    { name: 'id', type: Type.Integer, primaryKey: true },
  ]);
  await assert.rejects(
    User.find(),
    /Pass an Adapter constructor or instance instead/,
  );

  class LegacyConstructorAdapter {
    constructor(parent, options) {
      void parent;
      void options;
    }
  }
  assert.throws(
    () => new Toshihiko(LegacyConstructorAdapter),
    /legacy callback Adapter constructors are not supported/,
  );

  const callbackAdapter = {
    find(query, callback, options) {
      void query;
      void callback;
      void options;
    },
    getDBName() {
      return 'callback';
    },
  };
  await assert.rejects(
    new Toshihiko(callbackAdapter)
      .define('user', [{ name: 'id', primaryKey: true }])
      .find(),
    /callback Adapters are not supported/,
  );

  const synchronousAdapter = {
    find() {
      return [];
    },
    getDBName() {
      return 'sync';
    },
  };
  await assert.rejects(
    new Toshihiko(synchronousAdapter)
      .define('user', [{ name: 'id', primaryKey: true }])
      .find(),
    /must return a Promise/,
  );
});

test('Query rejects Adapter results with the wrong list or single shape', async () => {
  const wrongShapeAdapter = {
    async find(query, options) {
      void query;
      return options.single ? [] : { id: 1 };
    },
    getDBName() {
      return 'wrong-shape';
    },
  };
  const User = new Toshihiko(wrongShapeAdapter).define('user', [
    { name: 'id', type: Type.Integer, primaryKey: true },
  ]);

  await assert.rejects(
    User.find(),
    /must return an array for a list query/,
  );
  await assert.rejects(
    User.findOne(),
    /must return one row or null for a single query/,
  );
});
