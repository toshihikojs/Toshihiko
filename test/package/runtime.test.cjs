'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { Toshihiko, Type } = require('../..');

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
