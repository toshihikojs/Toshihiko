import assert from 'node:assert/strict';
import test from 'node:test';
import { Toshihiko, Type } from 'toshihiko';
import { MySQLSqlBuilder } from '../../dist';

const toshihiko = new Toshihiko('mysql');
const Model = toshihiko.define('test_table', [
  { name: 'id', column: 'user_id', type: Type.Integer, primaryKey: true },
  { name: 'score', type: Type.Float },
  { name: 'payload', type: Type.Json, allowNull: true },
  { name: 'name', type: Type.String },
]);
const builder = new MySQLSqlBuilder();

test('field predicates preserve v1 operators with escaped values', () => {
  assert.equal(builder.makeFieldWhere(Model, 'id', { $neq: 1 }), '`user_id` != 1');
  assert.equal(builder.makeFieldWhere(Model, 'score', { $between: [1, 100] }), '`score` BETWEEN 1 AND 100');
  assert.equal(builder.makeFieldWhere(Model, 'name', { $in: ['a', "b's"] }), "`name` IN ('a', 'b\\'s')");
  assert.equal(builder.makeFieldWhere(Model, 'payload', null), '`payload` IS NULL');
  assert.equal(
    builder.makeFieldWhere(Model, 'id', { $or: { $gt: 10, $lt: 3 }, $neq: [1, null] }),
    '((`user_id` > 10 OR `user_id` < 3) AND (`user_id` != 1 AND `user_id` IS NOT NULL))',
  );
  assert.equal(
    builder.makeFieldWhere(Model, 'payload', { nested: true }),
    '`payload` = \'{\\"nested\\":true}\'',
  );
});

test('where, order, limits, indexes, and identifiers compile deterministically', () => {
  assert.equal(
    builder.makeWhere(Model, {
      id: { '>=': 2 },
      $or: [{ name: 'Alice' }, { score: { $lt: 1.5 } }],
    }),
    "(`user_id` >= 2 AND ((`name` = 'Alice') OR (`score` < 1.5)))",
  );
  assert.equal(builder.makeOrder(Model, [{ id: -1 }, { name: 1 }]), '`user_id` DESC, `name` ASC');
  assert.equal(builder.makeLimit(Model, [10, 20]), '10, 20');
  assert.equal(builder.makeLimit(Model, ['30', '40']), '30, 40');
  assert.equal(builder.makeLimit(Model, [-1, Number.NaN]), '-1, 0');
  assert.equal(builder.makeIndex(Model, 'idx`name'), 'FORCE INDEX(`idx`name`)');
  assert.equal(builder.makeWhere(Model, {}), '()');
  assert.throws(() => builder.makeFieldWhere(Model, 'missing', 1), /no field named/);
  assert.equal(builder.makeFieldWhere(Model, 'id', { $in: [] }), '`user_id` IN ()');
});

test('find, update, delete, and raw expressions retain the original call shape', () => {
  assert.equal(builder.makeSql('legacy-unknown', Model), builder.makeFind(Model));
  assert.equal(
    builder.makeFind(Model, {
      fields: ['id', 'name'],
      where: { id: { $gte: 2 } },
      order: [{ name: 1 }],
      limit: [0, 5],
      index: 'primary',
    }),
    'SELECT `user_id`, `name` FROM `test_table` FORCE INDEX(`primary`) WHERE (`user_id` >= 2) ORDER BY `name` ASC LIMIT 0, 5',
  );
  assert.equal(
    builder.makeUpdate(Model, {
      update: { score: '{{score + 1}}', name: 'Bob' },
      where: { id: 1 },
    }),
    "UPDATE `test_table` SET `score` = score + 1, `name` = 'Bob' WHERE (`user_id` = 1)",
  );
  assert.equal(
    builder.makeDelete(Model, { where: { id: 1 }, limit: [0, 1] }),
    'DELETE FROM `test_table` WHERE (`user_id` = 1) LIMIT 1',
  );
  assert.throws(
    () => builder.makeDelete(Model, { limit: [2, 1] }),
    /Invalid limit in delete/,
  );
  assert.throws(() => builder.makeUpdate(Model, { update: {} }), /no set data/);
});

test('compiled statements preserve placeholders and value order', () => {
  assert.deepEqual(
    builder.compileFind(Model, {
      where: {
        id: { $between: [2, 9] },
        $or: [{ name: 'Alice' }, { score: { $in: [1.5, 2.5] } }],
      },
      limit: [0, 5],
    }),
    {
      sql: 'SELECT * FROM `test_table` WHERE (`user_id` BETWEEN ? AND ? AND ((`name` = ?) OR (`score` IN (?, ?)))) LIMIT 0, 5',
      values: [2, 9, 'Alice', 1.5, 2.5],
    },
  );
  assert.deepEqual(
    builder.compileUpdate(Model, {
      update: { score: '{{score + 1}}', name: 'Bob' },
      where: { id: 1 },
    }),
    {
      sql: 'UPDATE `test_table` SET `score` = score + 1, `name` = ? WHERE (`user_id` = ?)',
      values: ['Bob', 1],
    },
  );
});
