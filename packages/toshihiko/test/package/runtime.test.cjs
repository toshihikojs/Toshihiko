'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const moment = require('moment');

const { Escaper, Toshihiko, Type } = require('../..');
const { Yukari } = require('../../dist/yukari.js');

class MemoryAdapter {
  constructor(options) {
    this.options = options;
    this.calls = [];
    this.countCalls = [];
    this.deleteCalls = [];
    this.insertCalls = [];
    this.executeCalls = [];
    this.queryUpdateCalls = [];
    this.transactionCalls = [];
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

  async count(query) {
    this.countCalls.push({
      connection: query._conn,
      index: query._index,
      table: query.model.name,
      where: query._where,
    });
    if (this.options.countError) {
      throw this.options.countError;
    }
    return this.options.countResult ?? 0;
  }

  async updateByQuery(query) {
    this.queryUpdateCalls.push({
      connection: query._conn,
      data: query._updateData,
      where: query._where,
    });
    return this.options.queryUpdateResult;
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

  async deleteByQuery(query) {
    this.deleteCalls.push({
      connection: query._conn,
      limit: [...query._limit],
      table: query.model.name,
      where: query._where,
    });
    if (this.options.deleteError) {
      throw this.options.deleteError;
    }
    return this.options.deleteResult ?? { affectedRows: 1 };
  }

  async execute(...args) {
    this.executeCalls.push(args);
    return this.options.executeResult;
  }

  async beginTransaction() {
    this.transactionCalls.push(['begin']);
    return this.options.connection;
  }

  async commit(connection) {
    this.transactionCalls.push(['commit', connection]);
  }

  async rollback(connection) {
    this.transactionCalls.push(['rollback', connection]);
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
    { name: 'username', type: Type.String, defaultValue: 'anonymous' },
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
  assert.equal(typeof toshihiko.onAny, 'function');
  assert.equal(typeof User.onAny, 'function');
  assert.equal(User._fieldsKeyMap.n2c, User.nameToColumn);
  assert.equal(User._fieldsKeyMap.c2n, User.columnToName);
  assert.equal(User._fieldsKeyMap.name, User.fieldNamesMap);
  assert.equal(User._fieldsKeyMap.column, User.fieldColumnsMap);
  assert.equal(User.fieldNamesMap.nickname.type, Type.String);
  assert.equal(User.fieldNamesMap.nickname.default, '');
  assert.equal(User.fieldNamesMap.nickname.defaultValue, '');
  assert.equal(User.fieldNamesMap.nickname.needQuotes, true);
  assert.equal(User.fieldNamesMap.username.defaultValue, 'anonymous');
  assert.deepEqual(Object.keys(User.fieldNamesMap.nickname), [
    'allowNull',
    'autoIncrement',
    'column',
    'default',
    'name',
    'primaryKey',
    'type',
    'validators',
  ]);
  assert.equal(Object.hasOwn(User.fieldNamesMap.nickname, 'equal'), true);
  assert.equal(Object.hasOwn(User.fieldNamesMap.nickname, 'defaultValue'), false);
  assert.equal(Object.hasOwn(User.fieldNamesMap.nickname, 'options'), true);
  assert.equal(Object.keys(User.fieldNamesMap.nickname).includes('options'), false);
});

test('built-in field types retain v1 restore coercion for JavaScript callers', () => {
  assert.equal(Type.String.needQuotes, true);
  assert.equal(Type.Float.needQuotes, false);
  assert.equal(Type.String.restore(2), '2');
  assert.equal(Type.String.restore(null), '');
  assert.equal(Type.String.equal(null, 'null'), false);
  assert.equal(Type.Integer.restore('0x10'), 16);
  assert.equal(Type.Float.restore('2.5'), 2.5);
  assert.equal(Type.Boolean.name, '_Boolean');
  assert.equal(Type.$equal(1, 1), true);
  assert.equal(Type.$equal({}, {}), false);
  assert.equal(Escaper.escape("a'b"), "a\\'b");
  assert.equal(Escaper.escapeLike('a_b%'), 'a\\_b\\%');

  const Legacy = new Toshihiko('mysql').define('legacy', [{
    name: 'legacy_name',
    allow_null: true,
    primary_key: true,
    default_value: 'legacy',
    custom_option: 1,
    type: {},
  }]);
  const legacyField = Legacy.fieldNamesMap.legacy_name;
  assert.equal(legacyField.type, Type.String);
  assert.equal(legacyField.allowNull, true);
  assert.equal(legacyField.primaryKey, true);
  assert.equal(legacyField.default, 'legacy');
  assert.equal(legacyField.options.customOption, 1);
  assert.deepEqual(Type.Json.parse('{foo:1}'), { foo: 1 });
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  assert.deepEqual(Type.Json.parse('{foo:1'), {});
  if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousNodeEnv;
  const cyclic = {};
  cyclic.self = cyclic;
  assert.equal(Type.Json.equal(cyclic, {}), false);
  assert.equal(Type.Datetime.toJSON(null), null);
});

test('built-in field types pass the direct v1 conversion matrix', () => {
  for (const [input, expected] of [
    [undefined, ''],
    [null, ''],
    [{}, '[object Object]'],
    [1, '1'],
  ]) {
    assert.equal(Type.String.restore(input), expected);
    assert.equal(Type.String.parse(input), expected);
  }
  assert.equal(Type.String.equal('[object Object]', {}), true);
  assert.equal(Type.String.equal('123', '123'), true);
  assert.equal(Type.String.equal('123', '234'), false);
  assert.equal(Type.String.equal(null, undefined), false);

  assert.equal(Type.Boolean.restore(true), 1);
  assert.equal(Type.Boolean.restore(false), 0);
  for (const [input, expected] of [
    [undefined, false],
    [null, false],
    [1, true],
    [0, false],
    ['', false],
    [-100, true],
    [true, true],
    [false, false],
  ]) {
    assert.equal(Type.Boolean.parse(input), expected);
  }
  assert.equal(Type.Boolean.equal(0, 0), true);
  assert.equal(Type.Boolean.equal(10, 1), true);
  assert.equal(Type.Boolean.equal(true, 1), true);
  assert.equal(Type.Boolean.equal(false, 1), false);

  for (const [input, integer, float] of [
    ['1.2A', 1, 1.2],
    [1.2, 1, 1.2],
    [100, 100, 100],
  ]) {
    assert.equal(Type.Integer.restore(input), integer);
    assert.equal(Type.Integer.parse(input), integer);
    assert.equal(Type.Float.restore(input), float);
    assert.equal(Type.Float.parse(input), float);
  }
  assert.equal(Type.Integer.equal(1.2, 1.2), true);
  assert.equal(Type.Integer.equal('1.2', 1.2), true);
  assert.equal(Type.Integer.equal(1.3, 1.2), true);
  assert.equal(Type.Integer.equal('2', 1), false);
  assert.equal(Type.Float.equal('1.2', 1.2), true);
  assert.equal(Type.Float.equal('1.3', 1.2), false);

  assert.equal(Type.Json.restore({}), '{}');
  assert.equal(Type.Json.restore({ foo: 'bar' }), '{"foo":"bar"}');
  assert.equal(Type.Json.restore(null), 'null');
  assert.equal(Type.Json.restore('a'), '"a"');
  assert.deepEqual(Type.Json.parse('{}'), {});
  assert.equal(Type.Json.parse('null'), null);
  assert.equal(Type.Json.parse('"a"'), 'a');
  assert.deepEqual(Type.Json.parse('{"foo":"bar"}'), { foo: 'bar' });
  assert.equal(Type.Json.equal('{}', null), false);
  assert.equal(Type.Json.equal({ foo: 1 }, { foo: 1 }), true);
  assert.equal(Type.Json.equal({ foo: undefined }, {}), true);

  const date = new Date(2016, 9, 13, 17, 37, 0, 0);
  const formatted = '2016-10-13 17:37:00';
  assert.equal(Type.Datetime.restore(date), formatted);
  assert.equal(Type.Datetime.restore(formatted), formatted);
  assert.equal(Type.Datetime.restore(moment(date)), formatted);
  assert.deepEqual(Type.Datetime.parse(formatted), date);
  assert.equal(Type.Datetime.equal(date, formatted), true);
  assert.equal(Type.Datetime.equal(date, moment(formatted)), true);
  assert.equal(Type.Datetime.equal(date, '2016-10-13 17:38:00'), false);
  const json = moment(date).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
  assert.equal(Type.Datetime.toJSON(date), json);
  assert.equal(Type.Datetime.toJSON(moment(date)), json);
  assert.equal(Type.Datetime.toJSON(formatted), json);
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

test('define preserves v1 validator normalization for JavaScript callers', () => {
  const toshihiko = new Toshihiko('mysql');
  const validator = () => undefined;
  const ignored = toshihiko.define('ignored', [{ name: 'id', validators: 'required' }]);
  const retained = toshihiko.define('retained', [{ name: 'id', validators: ['required'] }]);
  const normalized = toshihiko.define('normalized', [{ name: 'id', validators: validator }]);

  assert.deepEqual(ignored.fieldNamesMap.id.validators, []);
  assert.deepEqual(retained.fieldNamesMap.id.validators, ['required']);
  assert.deepEqual(normalized.fieldNamesMap.id.validators, [validator]);
  assert.equal(
    normalized.fieldNamesMap.id.options.validators,
    normalized.fieldNamesMap.id.validators,
  );
});

test('Field retains v1 fallback behavior for empty columns and undefined defaults', () => {
  const Model = new Toshihiko('mysql').define('fallbacks', [
    { name: 'emptyColumn', column: '' },
    { name: 'undefinedDefault', defaultValue: undefined },
    { name: 'nullDefault', defaultValue: null, allowNull: true },
  ], null);

  assert.equal(Model.options !== null && typeof Model.options === 'object', true);
  assert.equal(Model.fieldNamesMap.emptyColumn.column, 'emptyColumn');
  assert.equal(Model.fieldNamesMap.undefinedDefault.defaultValue, '');
  assert.equal(Model.fieldNamesMap.nullDefault.defaultValue, null);
  assert.deepEqual(Model.build({}).toJSON(), {
    emptyColumn: '',
    undefinedDefault: '',
    nullDefault: null,
  });
});

test('build creates a new Yukari and clones field defaults', () => {
  const toshihiko = new Toshihiko('mysql');
  const User = toshihiko.define('user', [
    { name: 'id', type: Type.Integer },
    { name: 'name', type: Type.String, defaultValue: 'anonymous' },
    { name: 'settings', type: Type.Json },
    { name: 'birthday', type: Type.Datetime, allowNull: true },
  ]);

  const first = User.build({ id: 1, birthday: null, ignored: true });
  const second = User.build({ id: 2 });

  assert.equal(first.$model, User);
  assert.equal(first._initRow, undefined);
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

test('custom FieldType values keep their class and v1 fallback equality', async () => {
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
  const adapter = new MemoryAdapter({ database: 'toshihiko' });
  const Account = new Toshihiko(adapter).define('account', [
    { name: 'balance', type: MoneyType },
  ]);
  const balance = new Money(12);
  const account = Account.build({ balance });

  assert.notEqual(account.balance, balance);
  assert.equal(account.balance instanceof Money, true);
  assert.equal(account.balance.format(), '$12');

  const queried = new Yukari(Account, 'query');
  queried.fillRowFromSource({ balance: 12 }, true);
  await queried.update();
  assert.equal(queried.$origData.balance.data.amount, 12);
  assert.deepEqual(adapter.updateCalls[0].data.map(({ name, value }) => ({
    name,
    value: value.amount,
  })), [{ name: 'balance', value: 12 }]);
});

test('Field.parse delegates null coercion to the v1 FieldType', () => {
  const Model = new Toshihiko('mysql').define('nullable', [
    { name: 'required', type: Type.Integer },
    { name: 'optional', type: Type.Integer, allowNull: true },
  ]);

  assert.equal(Number.isNaN(Model.schema[0].parse(null)), true);
  assert.equal(Number.isNaN(Model.schema[1].parse(null)), true);
});

test('define preserves v1 field-name behavior without a reserved-name policy', () => {
  const toshihiko = new Toshihiko('mysql');

  for (const name of [
    'insert',
    'update',
    'delete',
    'save',
    'toJSON',
    'changes',
    'constructor',
    '$model',
  ]) {
    assert.doesNotThrow(() => toshihiko.define(`field-${name}`, [{ name }]));
  }
});

test('Yukari validation accepts sync and Promise validators in declaration order', async () => {
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

test('Yukari validation rejects nulls and preserves v1 synchronous messages', async () => {
  const toshihiko = new Toshihiko('mysql');
  const User = toshihiko.define('user', [
    { name: 'name', type: Type.String, allowNull: false },
    { name: 'legacy', validators: () => 'invalid' },
  ]);

  await assert.rejects(
    User.build({ name: null }).validateAll(),
    /Field name can't be null/,
  );
  await assert.rejects(User.build({ legacy: 'value' }).validateAll(), /invalid/);
});

test('build().insert() validates, writes, and adopts the Adapter row like v1', async () => {
  const validationCalls = [];
  const connection = { transaction: 1 };
  const toshihiko = new Toshihiko(MemoryAdapter, {
    database: 'toshihiko',
    insertRow: {
      id: 41,
      name: 'Stored Alice',
      profile: { role: 'admin' },
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
  assert.equal(user.$source, 'new');
  assert.equal(user.id, 41);
  assert.equal(user.name, 'Stored Alice');
  assert.deepEqual(user.profile, { role: 'admin' });
  assert.deepEqual(user.toJSON(true), {});
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

test('insert rejects old Yukari objects and adopts synchronous or empty Adapter results', async () => {
  const adapter = new MemoryAdapter({ database: 'toshihiko' });
  const toshihiko = new Toshihiko(adapter);
  const User = toshihiko.define('user', [{ name: 'id', type: Type.Integer }]);
  const queried = new Yukari(User, 'query');
  queried.fillRowFromSource({ id: 1 }, true);

  await assert.rejects(
    queried.insert(),
    /You must call this function via a new Yukari object/,
  );

  adapter.insert = function synchronousInsert() {
    return { id: 3 };
  };
  const synchronous = User.build({ id: 2 });
  assert.equal(await synchronous.insert(), synchronous);
  assert.equal(synchronous.id, 3);

  adapter.insert = async function invalidInsert() {
    return null;
  };
  const empty = User.build({ id: 4 });
  assert.equal(await empty.insert(), empty);
  assert.equal(empty.id, 4);

  adapter.insert = async function undefinedInsert() {
    return undefined;
  };
  const missing = User.build({ id: 5 });
  assert.equal(await missing.insert(), missing);
  assert.equal(missing.id, 5);
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
  assert.deepEqual(user.toJSON(true), {
    id: 8,
    name: 'Bob',
    profile: { role: 'admin' },
  });

  await user.update(connection);
  assert.equal(adapter.updateCalls.length, 2);
  assert.deepEqual(adapter.updateCalls[1].data, [
    { name: 'id', value: 8 },
    { name: 'name', value: 'Bob' },
    { name: 'profile', value: { role: 'admin' } },
  ]);
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
  assert.deepEqual(user.toJSON(), { id: 1, name: 'Bob' });

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

test('update preserves v1 source and locator fallbacks', async () => {
  const adapter = new MemoryAdapter({ database: 'toshihiko' });
  const toshihiko = new Toshihiko(adapter);
  const User = toshihiko.define('user', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name' },
  ]);

  await assert.rejects(
    User.build({ id: 1, name: 'Alice' }).update(),
    /You must call this function via an old Yukari object/,
  );
  const deleted = new Yukari(User, 'delete');
  deleted.fillRowFromSource({ id: 2, name: 'Deleted' }, true);
  await deleted.update();
  assert.equal(deleted.$source, 'query');

  const Keyless = toshihiko.define('keyless', [{ name: 'name' }]);
  const keyless = new Yukari(Keyless, 'query');
  keyless.fillRowFromSource({ name: 'Alice' }, true);
  keyless.name = 'Bob';
  await keyless.update();
  assert.deepEqual(adapter.updateCalls.at(-1).primaryKey, { name: 'Alice' });

  const projected = new Yukari(User, 'query');
  projected.fillRowFromSource({ name: 'Alice' }, true);
  projected.name = 'Bob';
  await projected.update();
  assert.deepEqual(adapter.updateCalls.at(-1).primaryKey, {});

  const synchronous = new Yukari(User, 'query');
  synchronous.fillRowFromSource({ id: 1, name: 'Alice' }, true);
  synchronous.name = 'Bob';
  adapter.update = function synchronousUpdate() {
    return {};
  };
  assert.equal(await synchronous.update(), synchronous);
});

test('queried Yukari deletes by original primary key and enters delete state', async () => {
  const connection = { transaction: 3 };
  const adapter = new MemoryAdapter({ database: 'toshihiko' });
  const User = new Toshihiko(adapter).define('user', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name' },
  ]);
  const user = new Yukari(User, 'query');
  user.fillRowFromSource({ id: 7, name: 'Alice' }, true);
  user.id = 8;
  user.name = 'Changed locally';

  const deleted = await user.delete(connection);

  assert.equal(deleted, true);
  assert.equal(user.$source, 'delete');
  assert.deepEqual(adapter.deleteCalls, [{
    connection,
    limit: [0, 1],
    table: 'user',
    where: { id: 7 },
  }]);
  assert.deepEqual(user.toJSON(true), { id: 7, name: 'Alice' });
  await user.delete(connection);

  const Membership = new Toshihiko(adapter).define('membership', [
    { name: 'userId', type: Type.Integer, primaryKey: true },
    { name: 'groupId', type: Type.Integer, primaryKey: true },
    { name: 'role' },
  ]);
  const membership = new Yukari(Membership, 'query');
  membership.fillRowFromSource({ userId: 2, groupId: 3, role: 'member' }, true);
  await membership.delete();
  assert.deepEqual(adapter.deleteCalls.at(-1), {
    connection: null,
    limit: [0, 1],
    table: 'membership',
    where: { userId: 2, groupId: 3 },
  });
});

test('delete failures and invalid records preserve their state', async () => {
  const deleteError = new Error('delete failed');
  const adapter = new MemoryAdapter({ database: 'toshihiko', deleteError });
  const toshihiko = new Toshihiko(adapter);
  const User = toshihiko.define('user', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name' },
  ]);
  const user = new Yukari(User, 'query');
  user.fillRowFromSource({ id: 1, name: 'Alice' }, true);

  await assert.rejects(user.delete(), (error) => error === deleteError);
  assert.equal(user.$source, 'query');
  adapter.options.deleteError = null;
  await assert.rejects(
    User.build({ id: 1 }).delete(),
    /You can't call this function via a new Yukari object/,
  );

  const Keyless = toshihiko.define('keyless', [{ name: 'name' }]);
  const keyless = new Yukari(Keyless, 'query');
  keyless.fillRowFromSource({ name: 'Alice' }, true);
  await keyless.delete();
  assert.deepEqual(adapter.deleteCalls.at(-1).where, { name: 'Alice' });

  const projected = new Yukari(User, 'query');
  projected.fillRowFromSource({ name: 'Alice' }, true);
  await projected.delete();
  assert.deepEqual(adapter.deleteCalls.at(-1).where, {});

  const synchronousAdapter = new MemoryAdapter({ database: 'toshihiko' });
  const SyncUser = new Toshihiko(synchronousAdapter).define('sync-user', [
    { name: 'id', type: Type.Integer, primaryKey: true },
  ]);
  const synchronous = new Yukari(SyncUser, 'query');
  synchronous.fillRowFromSource({ id: 1 }, true);
  synchronousAdapter.deleteByQuery = function synchronousDelete() {
    return {};
  };
  assert.equal(await synchronous.delete(), true);
  assert.equal(synchronous.$source, 'delete');

  const falseAdapter = new MemoryAdapter({ database: 'toshihiko', deleteResult: false });
  const FalseUser = new Toshihiko(falseAdapter).define('false-user', [{
    name: 'id',
    primaryKey: true,
  }]);
  const falseUser = new Yukari(FalseUser, 'query');
  falseUser.fillRowFromSource({ id: 1 }, true);
  await assert.rejects(falseUser.delete(), /unknown error/);
  assert.equal(falseUser.$source, 'query');
});

test('save preserves v1 new-versus-old dispatch', async () => {
  const connection = { transaction: 4 };
  const adapter = new MemoryAdapter({
    database: 'toshihiko',
    insertRow: { id: 1, name: 'Alice' },
  });
  const User = new Toshihiko(adapter).define('user', [
    { name: 'id', type: Type.Integer, primaryKey: true },
    { name: 'name' },
  ]);
  const user = User.build({ id: 1, name: 'Alice' });

  assert.equal(await user.save(connection), user);
  assert.equal(user.$source, 'new');
  assert.equal(adapter.insertCalls[0].connection, connection);

  assert.equal(await user.save(connection), user);
  assert.equal(adapter.insertCalls.length, 2);

  const queried = new Yukari(User, 'query');
  queried.fillRowFromSource({ id: 1, name: 'Alice' }, true);
  queried.name = 'Bob';
  assert.equal(await queried.save(connection), queried);
  await queried.delete(connection);
  assert.equal(await queried.save(connection), queried);
  assert.equal(queried.$source, 'query');
});

test('Model and Query count through the configured Adapter', async () => {
  const connection = { transaction: 5 };
  const adapter = new MemoryAdapter({ database: 'toshihiko', countResult: 3 });
  const User = new Toshihiko(adapter).define('user', [
    { name: 'id', type: Type.Integer },
    { name: 'name' },
  ]);

  assert.equal(await User
    .where({ id: { $gte: 2 } })
    .index('count_idx')
    .conn(connection)
    .count(), 3);
  assert.equal(await User.count(), 3);
  assert.deepEqual(adapter.countCalls, [
    {
      connection,
      index: 'count_idx',
      table: 'user',
      where: { id: { $gte: 2 } },
    },
    {
      connection: null,
      index: '',
      table: 'user',
      where: {},
    },
  ]);
});

test('Model and Query preserve the v1 mutation, execution, and transaction facades', async () => {
  const connection = { transaction: 6 };
  const adapter = new MemoryAdapter({
    connection,
    database: 'toshihiko',
    executeResult: { ok: true },
    queryUpdateResult: { affectedRows: 2 },
  });
  const User = new Toshihiko(adapter).define('user', [{ name: 'id' }, { name: 'name' }]);

  assert.deepEqual(await User.where({ id: 1 }).update({ name: 'Bob' }), { affectedRows: 2 });
  assert.deepEqual(await User.where({ id: 2 }).delete(), { affectedRows: 1 });
  assert.deepEqual(await User.conn(connection).execute('SELECT 1'), { ok: true });
  assert.equal(await User.beginTransaction(), connection);
  await User.commit(connection);
  await User.rollback(connection);

  assert.deepEqual(adapter.queryUpdateCalls, [{
    connection: null,
    data: { name: 'Bob' },
    where: { id: 1 },
  }]);
  assert.deepEqual(adapter.executeCalls, [[connection, 'SELECT 1']]);
  assert.deepEqual(adapter.transactionCalls, [
    ['begin'],
    ['commit', connection],
    ['rollback', connection],
  ]);
});

test('count preserves Adapter failures and returns Adapter values unchanged', async () => {
  const countError = new Error('count failed');
  const failingAdapter = new MemoryAdapter({ database: 'toshihiko', countError });
  const Failure = new Toshihiko(failingAdapter).define('failure', [{ name: 'id' }]);
  await assert.rejects(Failure.count(), (error) => error === countError);

  const synchronousAdapter = new MemoryAdapter({ database: 'toshihiko' });
  const Synchronous = new Toshihiko(synchronousAdapter)
    .define('synchronous', [{ name: 'id' }]);
  synchronousAdapter.count = function synchronousCount() {
    return 1;
  };
  assert.equal(await Synchronous.count(), 1);

  for (const [name, countResult] of [
    ['string', '3'],
    ['nan', Number.NaN],
    ['infinity', Number.POSITIVE_INFINITY],
    ['negative', -1],
  ]) {
    const invalidAdapter = new MemoryAdapter({ database: 'toshihiko', countResult });
    const Invalid = new Toshihiko(invalidAdapter)
      .define(`invalid-${name}`, [{ name: 'id' }]);
    assert.equal(await Invalid.count(), countResult);
  }
});

test('Yukari restores database columns without applying build defaults', () => {
  const toshihiko = new Toshihiko('mysql');
  const User = toshihiko.define('user', [
    { name: 'id', column: 'user_id', type: Type.Integer },
    { name: 'name', type: Type.String, defaultValue: 'anonymous' },
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
});

test('Yukari serializes current and original rows and extracts Adapter data', () => {
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
    { name: 'handler' },
  ]);
  const yukari = new Yukari(User, 'query');
  yukari.fillRowFromSource({
    user_id: '7',
    settings: '{"theme":"dark"}',
    created_at: '2026-08-26T01:02:03.000Z',
  }, true);

  yukari.id = 8;
  yukari.settings.theme = 'light';
  yukari.custom = 'visible';
  const handler = () => undefined;
  yukari.handler = handler;
  assert.deepEqual(yukari.toJSON(), {
    id: 8,
    settings: { theme: 'light' },
    createdAt: new Date('2026-08-26T01:02:03.000Z'),
    custom: 'visible',
  });
  assert.deepEqual(yukari.toJSON(true), {
    id: 7,
    settings: { theme: 'dark' },
    createdAt: new Date('2026-08-26T01:02:03.000Z'),
  });

  yukari.createdAt = null;
  assert.deepEqual(
    Yukari.extractAdapterData(User, yukari).map(({ field, value }) => ({
      name: field.name,
      value,
    })),
    [
      { name: 'id', value: 8 },
      { name: 'settings', value: { theme: 'light' } },
      { name: 'createdAt', value: null },
      { name: 'handler', value: handler },
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

  const freshQuery = User.where({});
  assert.equal(freshQuery.field, freshQuery.fields);
  assert.equal(freshQuery.orderBy, freshQuery.order);
  assert.equal(Object.keys(freshQuery).includes('model'), false);
  assert.equal(Object.keys(freshQuery).includes('toshihiko'), false);
  assert.equal(Object.keys(freshQuery).includes('cache'), false);
  assert.deepEqual(User.order({ id: 2 })._order, [{ id: 2 }]);
  assert.deepEqual(User.order(['id  desc'])._order, [{ id: 1 }]);

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

  const withoutCache = await User.find({ noCache: 'yes' });
  assert.equal(withoutCache[0] instanceof Yukari, true);
  assert.deepEqual(toshihiko.adapter.calls[4].options, {
    noCache: true,
    single: false,
  });
});

test('Query and Model configuration retains the v1 argument behavior', () => {
  const adapter = new MemoryAdapter({ database: 'toshihiko', rows: [] });
  const toshihiko = new Toshihiko(adapter);
  const User = toshihiko.define('user', [
    { name: 'id', column: 'user_id', primaryKey: true },
    { name: 'tenantId', column: 'tenant_id', primaryKey: true },
    { name: 'name' },
  ]);
  const query = User.where({});

  const condition = { name: 'Alice' };
  assert.equal(query.where(condition), query);
  assert.equal(query._where, condition);
  assert.throws(() => query.where(1), /query condition expected to be an object/);

  assert.equal(query.fields('id, name, , '), query);
  assert.deepEqual(query._fields, ['id', 'name']);
  const fields = ['tenantId', 'name'];
  assert.equal(query.fields(fields), query);
  assert.equal(query._fields, fields);
  assert.throws(() => query.fields(1), /query fields expected to be an array or string/);

  for (const [input, expected] of [
    ['1,2', [1, 2]],
    ['   1,2    ,3,', [1, 2]],
    ['1,invalid', [1, 0]],
    ['1', [1]],
    ['', []],
    ['invalid', [0]],
    [['1', 2], [1, 2]],
    [[1, 2, '3'], [1, 2]],
    [[1, 'invalid'], [1, 0]],
    [[], []],
    [123, [123]],
    [-1, [-1]],
  ]) {
    assert.equal(query.limit(input), query);
    assert.deepEqual(query._limit, expected);
  }
  assert.equal(query.limit('1', 'invalid'), query);
  assert.deepEqual(query._limit, [1, 0]);
  assert.throws(
    () => query.limit(true),
    /query limit expected to be an array, number or string but got boolean true/,
  );

  assert.equal(query.order('   name, tenantId aSc    , id     desc'), query);
  assert.deepEqual(query._order, [
    { name: 1 },
    { tenantId: 1 },
    { id: -1 },
  ]);
  assert.deepEqual(query.order('  ')._order, []);
  assert.deepEqual(query.order([
    'name',
    'tenantId DeSc',
    { id: 'aSc' },
    { other: -1 },
  ])._order, [
    { name: 1 },
    { tenantId: -1 },
    { id: 1 },
    { other: -1 },
  ]);
  assert.deepEqual(query.order({
    name: 1,
    tenantId: 'DesC',
    id: 'aSc',
    other: -1,
  })._order, [
    { name: 1 },
    { tenantId: -1 },
    { id: 1 },
    { other: -1 },
  ]);

  const connection = { transaction: true };
  assert.equal(query.conn(connection), query);
  assert.equal(query._conn, connection);
  assert.equal(query.index(connection), query);
  assert.equal(query._index, connection);

  assert.deepEqual(User.limit(1, 2)._limit, [1, 2]);
  assert.deepEqual(User.limit([1, 2])._limit, [1, 2]);
  assert.deepEqual(User.convertColumnToName(['user_id', 'name']), ['id', 'name']);
  assert.deepEqual(User.convertColumnToName({ user_id: 1, name: 'Alice' }), {
    id: 1,
    name: 'Alice',
  });
  assert.equal(User.convertColumnToName(1), undefined);
  assert.deepEqual(User.getPrimaryKeysName(), ['id', 'tenantId']);
  assert.deepEqual(User.getPrimaryKeysColumn(), ['user_id', 'tenant_id']);
});

test('findById preserves v1 composite-key object forwarding', async () => {
  const adapter = new MemoryAdapter({ database: 'toshihiko', rows: [] });
  const toshihiko = new Toshihiko(adapter);
  const Membership = toshihiko.define('membership', [
    { name: 'userId', column: 'user_id', type: Type.Integer, primaryKey: true },
    { name: 'groupId', column: 'group_id', type: Type.Integer, primaryKey: true },
  ]);

  await Membership.findById({ userId: 1, groupId: 2 });
  assert.deepEqual(adapter.calls[0].where, { userId: 1, groupId: 2 });

  await Membership.findById({ userId: 1 });
  assert.deepEqual(adapter.calls[1].where, { userId: 1 });
});

test('unresolved dialects fail clearly while synchronous Adapter values are adopted', async () => {
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
  assert.deepEqual(await new Toshihiko(synchronousAdapter)
    .define('user', [{ name: 'id', primaryKey: true }])
    .find(), []);
});

test('Query preserves v1 pass-through behavior for unusual Adapter result shapes', async () => {
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

  assert.deepEqual(await User.find(), { id: 1 });
  assert.deepEqual((await User.findOne()).toJSON(), {});
});

test('Query and Yukari retain the Adapter captured at construction like v1', async () => {
  const first = new MemoryAdapter({ database: 'first', rows: [] });
  const second = new MemoryAdapter({ database: 'second', rows: [] });
  const toshihiko = new Toshihiko(first);
  const User = toshihiko.define('user', [{ name: 'id' }]);
  const query = User.where({ id: 1 });
  const built = User.build({ id: 2 });

  toshihiko.adapter = second;
  await query.find();
  await built.insert();
  await User.where({ id: 3 }).find();

  assert.equal(first.calls.length, 1);
  assert.equal(first.insertCalls.length, 1);
  assert.equal(second.calls.length, 1);
});
