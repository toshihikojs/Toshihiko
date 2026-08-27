'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { Toshihiko, Type } = require('../..');
const { Yukari } = require('../../dist/yukari.js');

class MemoryAdapter {
  constructor(options) {
    this.options = options;
    this.calls = [];
    this.insertCalls = [];
    this.updateCalls = [];
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

  async insert(model, connection, data) {
    this.insertCalls.push({
      connection,
      data: data.map(({ field, value }) => ({ name: field.name, value })),
      table: model.name,
    });
    if (this.options.insertError) {
      throw this.options.insertError;
    }
    return this.options.insertRow ?? null;
  }

  async update(model, connection, primaryKey, data) {
    this.updateCalls.push({
      connection,
      data: data.map(({ field, value }) => ({ name: field.name, value })),
      primaryKey,
      table: model.name,
    });
    if (this.options.updateError) {
      throw this.options.updateError;
    }
    return this.options.updateResult;
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

test('built-in field types retain v1 restore coercion for JavaScript callers', () => {
  assert.equal(Type.String.needQuotes, true);
  assert.equal(Type.Float.needQuotes, false);
  assert.equal(Type.String.restore(2), '2');
  assert.equal(Type.String.restore(null), '');
  assert.equal(Type.Float.restore('2.5'), 2.5);
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

test('custom FieldType values keep their class and independent change snapshots', () => {
  class Money {
    constructor(amount) {
      this.amount = amount;
    }

    format() {
      return `$${this.amount}`;
    }
  }

  const MoneyType = {
    name: 'Money',
    parse(value) {
      return value instanceof Money ? value : new Money(Number(value));
    },
    restore(value) {
      return value.amount;
    },
  };
  const Account = new Toshihiko('mysql').define('account', [
    { name: 'balance', type: MoneyType },
  ]);
  const balance = new Money(12);
  const account = Account.build({ balance });

  assert.notEqual(account.balance, balance);
  assert.equal(account.balance instanceof Money, true);
  assert.equal(account.balance.format(), '$12');

  const queried = new Yukari(Account, 'query');
  queried.fillRowFromSource({ balance: 12 }, true);
  assert.deepEqual(queried.changes(), []);
  queried.balance.amount = 15;
  assert.equal(queried.$origData.balance.data.amount, 12);
  assert.deepEqual(queried.changes().map(({ field, value }) => ({
    name: field.name,
    value: value.amount,
  })), [{ name: 'balance', value: 15 }]);
});

test('Field.parse rejects null for non-null fields and preserves allowed nulls', () => {
  const Model = new Toshihiko('mysql').define('nullable', [
    { name: 'required', type: Type.Integer },
    { name: 'optional', type: Type.Integer, allowNull: true },
  ]);

  assert.throws(() => Model.schema[0].parse(null), /can't be null/);
  assert.equal(Model.schema[1].parse(null), null);
});

test('define rejects field names reserved by Yukari', () => {
  const toshihiko = new Toshihiko('mysql');

  for (const name of ['insert', 'toJSON', 'changes', 'constructor', '$model']) {
    assert.throws(
      () => toshihiko.define(`reserved-${name}`, [{ name }]),
      /is reserved by Yukari/,
    );
  }
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

test('build().insert() validates, writes, and hydrates the same Yukari', async () => {
  const validationCalls = [];
  const connection = { transaction: 1 };
  const toshihiko = new Toshihiko(MemoryAdapter, {
    database: 'toshihiko',
    insertRow: {
      user_id: '41',
      display_name: 'Stored Alice',
      profile: '{"role":"admin"}',
    },
  });
  const User = toshihiko.define('user', [
    {
      name: 'id',
      column: 'user_id',
      type: Type.Integer,
      primaryKey: true,
      autoIncrement: true,
    },
    {
      name: 'name',
      column: 'display_name',
      type: Type.String,
      async validators(value) {
        validationCalls.push(value);
      },
    },
    { name: 'profile', type: Type.Json },
  ]);
  const user = User.build({
    name: 'Input Alice',
    profile: { role: 'writer' },
    ignored: true,
  });

  const inserted = await user.insert(connection);

  assert.equal(inserted, user);
  assert.equal(user.$source, 'query');
  assert.equal(user.id, 41);
  assert.equal(user.name, 'Stored Alice');
  assert.deepEqual(user.profile, { role: 'admin' });
  assert.deepEqual(user.changes(), []);
  assert.deepEqual(user.toJSON(true), {
    id: 41,
    name: 'Stored Alice',
    profile: { role: 'admin' },
  });
  assert.deepEqual(validationCalls, ['Input Alice']);
  assert.deepEqual(toshihiko.adapter.insertCalls, [{
    connection,
    data: [
      { name: 'id', value: 0 },
      { name: 'name', value: 'Input Alice' },
      { name: 'profile', value: { role: 'writer' } },
    ],
    table: 'user',
  }]);
});

test('insert failures leave a new Yukari unchanged', async () => {
  const validationAdapter = new MemoryAdapter({ database: 'toshihiko' });
  const validating = new Toshihiko(validationAdapter);
  const Invalid = validating.define('invalid', [{
    name: 'score',
    type: Type.Integer,
    async validators() {
      return 'invalid score';
    },
  }]);
  const invalid = Invalid.build({ score: -1 });

  await assert.rejects(invalid.insert(), /invalid score/);
  assert.equal(invalid.$source, 'new');
  assert.equal(validationAdapter.insertCalls.length, 0);

  const adapterError = new Error('insert readback failed');
  const failingAdapter = new MemoryAdapter({
    database: 'toshihiko',
    insertError: adapterError,
  });
  const failing = new Toshihiko(failingAdapter);
  const Failure = failing.define('failure', [{ name: 'name' }]);
  const failure = Failure.build({ name: 'Alice' });

  await assert.rejects(failure.insert(), (error) => error === adapterError);
  assert.equal(failure.$source, 'new');
});

test('insert rejects old Yukari objects, synchronous Adapters, and invalid rows', async () => {
  const adapter = new MemoryAdapter({ database: 'toshihiko' });
  const toshihiko = new Toshihiko(adapter);
  const User = toshihiko.define('user', [{ name: 'id', type: Type.Integer }]);
  const queried = new Yukari(User, 'query');
  queried.fillRowFromSource({ id: 1 }, true);

  await assert.rejects(queried.insert(), /only be called on a new Yukari/);

  adapter.insert = function synchronousInsert() {
    return { id: 3 };
  };
  await assert.rejects(
    User.build({ id: 3 }).insert(),
    /must return a Promise/,
  );

  adapter.insert = async function invalidInsert() {
    return null;
  };
  await assert.rejects(
    User.build({ id: 4 }).insert(),
    /returned an invalid row/,
  );
});

test('queried Yukari updates changed fields with its original primary key', async () => {
  const validationCalls = [];
  const connection = { transaction: 2 };
  const adapter = new MemoryAdapter({ database: 'toshihiko' });
  const toshihiko = new Toshihiko(adapter);
  const User = toshihiko.define('user', [
    { name: 'id', column: 'user_id', type: Type.Integer, primaryKey: true },
    {
      name: 'name',
      column: 'display_name',
      async validators(value) {
        validationCalls.push(value);
      },
    },
    { name: 'profile', type: Type.Json },
  ]);
  const user = new Yukari(User, 'query');
  user.fillRowFromSource({
    user_id: '7',
    display_name: 'Alice',
    profile: '{"role":"writer"}',
  }, true);
  user.id = 8;
  user.name = 'Bob';
  user.profile.role = 'admin';

  const updated = await user.update(connection);

  assert.equal(updated, user);
  assert.equal(user.$source, 'query');
  assert.deepEqual(adapter.updateCalls, [{
    connection,
    data: [
      { name: 'id', value: 8 },
      { name: 'name', value: 'Bob' },
      { name: 'profile', value: { role: 'admin' } },
    ],
    primaryKey: { id: 7 },
    table: 'user',
  }]);
  assert.deepEqual(validationCalls, ['Bob']);
  assert.deepEqual(user.changes(), []);
  assert.deepEqual(user.toJSON(true), {
    id: 8,
    name: 'Bob',
    profile: { role: 'admin' },
  });

  await user.update(connection);
  assert.equal(adapter.updateCalls.length, 1);
  assert.deepEqual(validationCalls, ['Bob', 'Bob']);
});

test('update failures preserve original snapshots and pending changes', async () => {
  const updateError = new Error('stale row');
  const adapter = new MemoryAdapter({ database: 'toshihiko', updateError });
  const User = new Toshihiko(adapter).define('user', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name' },
  ]);
  const user = new Yukari(User, 'query');
  user.fillRowFromSource({ id: 1, name: 'Alice' }, true);
  user.name = 'Bob';

  await assert.rejects(user.update(), (error) => error === updateError);
  assert.deepEqual(user.toJSON(true), { id: 1, name: 'Alice' });
  assert.deepEqual(user.changes().map(({ field, value }) => ({
    name: field.name,
    value,
  })), [{ name: 'name', value: 'Bob' }]);

  const Invalid = new Toshihiko(new MemoryAdapter({ database: 'toshihiko' }))
    .define('invalid', [
      { name: 'id', type: Type.Integer, primaryKey: true },
      {
        name: 'score',
        type: Type.Integer,
        async validators() {
          return 'invalid score';
        },
      },
    ]);
  const invalid = new Yukari(Invalid, 'query');
  invalid.fillRowFromSource({ id: 1, score: 1 }, true);
  invalid.score = -1;
  await assert.rejects(invalid.update(), /invalid score/);
  assert.equal(Invalid.parent.adapter.updateCalls.length, 0);
});

test('update enforces source, primary-key, and Promise boundaries', async () => {
  const adapter = new MemoryAdapter({ database: 'toshihiko' });
  const toshihiko = new Toshihiko(adapter);
  const User = toshihiko.define('user', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name' },
  ]);

  await assert.rejects(User.build({ id: 1, name: 'Alice' }).update(), /queried Yukari/);
  await assert.rejects(new Yukari(User, 'delete').update(), /queried Yukari/);

  const Keyless = toshihiko.define('keyless', [{ name: 'name' }]);
  const keyless = new Yukari(Keyless, 'query');
  keyless.fillRowFromSource({ name: 'Alice' }, true);
  keyless.name = 'Bob';
  await assert.rejects(keyless.update(), /has no primary key/);

  const projected = new Yukari(User, 'query');
  projected.fillRowFromSource({ name: 'Alice' }, true);
  projected.name = 'Bob';
  await assert.rejects(projected.update(), /missing original primary key id/);

  const synchronous = new Yukari(User, 'query');
  synchronous.fillRowFromSource({ id: 1, name: 'Alice' }, true);
  synchronous.name = 'Bob';
  adapter.update = function synchronousUpdate() {
    return {};
  };
  await assert.rejects(synchronous.update(), /must return a Promise/);
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

test('v2 rejects unresolved and synchronous Adapters clearly', async () => {
  const unresolved = new Toshihiko('mysql');
  const User = unresolved.define('user', [
    { name: 'id', type: Type.Integer, primaryKey: true },
  ]);
  await assert.rejects(
    User.find(),
    /Pass an Adapter constructor or instance instead/,
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
