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
