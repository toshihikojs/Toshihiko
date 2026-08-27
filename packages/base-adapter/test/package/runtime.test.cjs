'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  Adapter,
  extend,
} = require('../..');
const { Toshihiko, Type } = require('toshihiko');

test('Adapter copies options and remains directly usable by Toshihiko', async () => {
  const options = { database: 'typed' };
  const adapter = new Adapter(options);
  options.database = 'changed';

  assert.deepEqual(adapter.options, { database: 'typed' });
  assert.equal(new Adapter(null).getDBName(), '');

  const toshihiko = new Toshihiko(Adapter, { database: 'typed' });
  assert.equal(toshihiko.adapter.parent, toshihiko);
  const User = toshihiko.define('user', [
    { name: 'id', type: Type.Integer, primaryKey: true },
  ]);
  await assert.rejects(
    User.find(),
    (error) => error instanceof Error
      && error.constructor === Error
      && error.message === "this adapter's find function is not implemented yet.",
  );
});

test('Adapter deep-clones non-plain option objects like v1', () => {
  class OptionsWithMethod {
    constructor() {
      this.database = 'typed';
    }

    getDatabase() {
      return this.database;
    }
  }

  const options = new OptionsWithMethod();
  const adapter = new Adapter(options);

  assert.notEqual(adapter.options, options);
  assert.equal(adapter.options instanceof OptionsWithMethod, true);
  assert.equal(adapter.options.getDatabase(), 'typed');
});

test('base operations preserve the original not-implemented failures', async () => {
  const adapter = new Adapter({});
  const query = {
    _conn: null,
    _fields: [],
    _index: '',
    _limit: [],
    _order: [],
    _where: {},
    model: {},
  };
  const operations = [
    ['find', () => adapter.find(query)],
    ['count', () => adapter.count(query)],
    ['updateByQuery', () => adapter.updateByQuery(query)],
    ['deleteByQuery', () => adapter.deleteByQuery(query)],
    ['insert', () => adapter.insert({}, null, [])],
    ['update', () => adapter.update({}, null, {}, [])],
    ['execute', () => adapter.execute()],
    ['beginTransaction', () => adapter.beginTransaction()],
    ['commit', () => adapter.commit({})],
    ['rollback', () => adapter.rollback({})],
  ];

  for (const [method, invoke] of operations) {
    const pending = invoke();
    assert.equal(typeof pending.then, 'function');
    await assert.rejects(
      pending,
      (error) => error instanceof Error
        && error.constructor === Error
        && error.message === `this adapter's ${method} function is not implemented yet.`,
    );
  }
});

test('extend deep-merges own data without mutating its inputs', () => {
  const defaults = {
    array: [{ value: 1 }],
    nested: { fromDefault: true },
    timestamp: new Date(0),
  };
  const options = {
    nested: { fromOptions: true },
  };
  const result = extend(defaults, options);

  assert.deepEqual(result, {
    array: [{ value: 1 }],
    nested: { fromDefault: true, fromOptions: true },
    timestamp: new Date(0),
  });
  result.array[0].value = 2;
  result.timestamp.setTime(1);
  assert.equal(defaults.array[0].value, 1);
  assert.equal(defaults.timestamp.getTime(), 0);
  assert.deepEqual(options, { nested: { fromOptions: true } });
});

test('extend accepts non-plain roots and copies special keys as own data', () => {
  const inherited = Object.create({ inherited: true });
  inherited.own = true;
  assert.deepEqual(extend(inherited, {}), { own: true });

  const defaults = { own: true };
  const malicious = JSON.parse('{"__proto__":{"polluted":true},"safe":1}');
  const result = extend(defaults, malicious);

  assert.deepEqual({ own: result.own, safe: result.safe }, { own: true, safe: 1 });
  assert.deepEqual(Object.getOwnPropertyDescriptor(result, '__proto__')?.value, { polluted: true });
  assert.equal({}.polluted, undefined);
});

test('extend types follow option-overrides-default runtime semantics', () => {
  const result = extend(
    { nested: { fromDefault: true }, port: 3306 },
    { nested: { fromOptions: 'yes' }, port: '3307' },
  );

  assert.deepEqual(result, {
    nested: { fromDefault: true, fromOptions: 'yes' },
    port: '3307',
  });
});

test('extend preserves the v1 recursive precedence for overlapping nested keys', () => {
  const result = extend(
    { nested: { same: 'default' } },
    { nested: { same: 'option' } },
  );

  assert.deepEqual(result, { nested: { same: 'default' } });
});
