'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  Adapter,
  AdapterNotImplementedError,
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
  const User = toshihiko.define('user', [
    { name: 'id', type: Type.Integer, primaryKey: true },
  ]);
  await assert.rejects(
    User.find(),
    (error) => error instanceof AdapterNotImplementedError
      && error.method === 'find',
  );
});

test('all base operations reject through the Promise-only boundary', async () => {
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
      (error) => error instanceof AdapterNotImplementedError
        && error.method === method
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

test('extend ignores inherited and prototype-pollution keys', () => {
  const defaults = Object.create({ inherited: true });
  defaults.own = true;
  const malicious = JSON.parse('{"__proto__":{"polluted":true},"safe":1}');
  const result = extend(defaults, malicious);

  assert.deepEqual(result, { own: true, safe: 1 });
  assert.equal({}.polluted, undefined);
});
