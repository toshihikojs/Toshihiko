import assert from 'node:assert/strict';
import test from 'node:test';
import { Toshihiko, Type, type FieldType } from 'toshihiko';
import { MySQLSqlBuilder } from '../../dist';

const BinaryType = Object.freeze({
  name: 'Binary',
  needQuotes: false,
  parse(value: string) {
    return { dec: Number.parseInt(String(value), 2) };
  },
  restore(value: { readonly dec: number }) {
    return `BIN(${Number.parseInt(String(value.dec), 10)})`;
  },
}) satisfies FieldType<{ readonly dec: number }, string>;

const toshihiko = new Toshihiko('mysql');
const Model = toshihiko.define('test_table', [
  { name: 'key1', column: 'id', type: Type.Integer, primaryKey: true, autoIncrement: true },
  { name: 'key2', type: Type.Float },
  { name: 'key3', type: Type.Json },
  { name: 'key4', type: Type.String, allowNull: true },
  { name: 'key5', type: Type.Datetime },
  { name: 'key6', type: BinaryType },
]);
const builder = new MySQLSqlBuilder();

test('v1 scalar comparison operators remain compatible', () => {
  assert.equal(builder.makeFieldWhere(Model, 'key1', { $neq: 1 }, 'and'), '`id` != 1');
  assert.equal(builder.makeFieldWhere(Model, 'key2', { $eq: 1.2 }), '`key2` = 1.2');
  assert.equal(builder.makeFieldWhere(Model, 'key2', { $in: [1.2, 1.3] }), '`key2` IN (1.2, 1.3)');
  assert.equal(builder.makeFieldWhere(Model, 'key4', { $like: 'abc$%' }), "`key4` LIKE 'abc$%'");
  assert.equal(builder.makeFieldWhere(Model, 'key2', { $between: [1, 100] }), '`key2` BETWEEN 1 AND 100');
  assert.equal(builder.makeFieldWhere(Model, 'key1', { '<=': 2 }), '`id` <= 2');
  assert.equal(builder.makeFieldWhere(Model, 'key1', { '>=': 2 }), '`id` >= 2');
});

test('v1 repeated and nested field operators retain grouping', () => {
  assert.equal(
    builder.makeFieldWhere(Model, 'key2', { $neq: [1.2, 1.3] }),
    '(`key2` != 1.2 AND `key2` != 1.3)',
  );
  assert.equal(
    builder.makeFieldWhere(Model, 'key2', {
      $or: { $gt: 10, $lt: 3, $in: [4, 5], $neq: [6, 8] },
    }),
    '(`key2` > 10 OR `key2` < 3 OR `key2` IN (4, 5) OR (`key2` != 6 AND `key2` != 8))',
  );
  assert.equal(
    builder.makeFieldWhere(Model, 'key2', {
      $or: { $gt: 10, $lt: 3 },
      $neq: [1, 11, null],
    }),
    '((`key2` > 10 OR `key2` < 3) AND (`key2` != 1 AND `key2` != 11 AND `key2` IS NOT NULL))',
  );
  assert.equal(
    builder.makeFieldWhere(Model, 'key2', {
      $or: { $gt: 10, $lt: 3, $eq: { $or: [4, 5, 6, null], $and: [1, 2] } },
      $neq: [1, 11],
    }),
    '((`key2` > 10 OR `key2` < 3 OR ((`key2` = 1 AND `key2` = 2) AND (`key2` = 4 OR `key2` = 5 OR `key2` = 6 OR `key2` IS NULL))) AND (`key2` != 1 AND `key2` != 11))',
  );
});

test('v1 JSON, date, null, and custom unquoted types restore correctly', () => {
  const date = new Date(2020, 0, 2, 3, 4, 5);
  assert.equal(builder.makeFieldWhere(Model, 'key3', { foo: 'bar' }), '`key3` = \'{\\"foo\\":\\"bar\\"}\'');
  assert.equal(builder.makeFieldWhere(Model, 'key3', 1), "`key3` = '1'");
  assert.equal(builder.makeFieldWhere(Model, 'key3', null), '`key3` IS NULL');
  assert.equal(builder.makeFieldWhere(Model, 'key4', { $in: [1, 2, 'bar'] }), "`key4` IN ('1', '2', 'bar')");
  assert.equal(builder.makeFieldWhere(Model, 'key5', date), "`key5` = '2020-01-02 03:04:05'");
  assert.equal(builder.makeFieldWhere(Model, 'key6', { dec: 100 }), '`key6` = BIN(100)');
  assert.deepEqual(builder.compileFieldWhere(Model, 'key6', { dec: 100 }), {
    sql: '`key6` = BIN(100)',
    values: [],
  });
});

test('v1 object and array where trees retain ordering and logic', () => {
  const condition = {
    key1: '1',
    key2: '2',
    $or: [
      { key3: 1, key4: '2' },
      { $or: { key3: 2, key4: '3' } },
      { $and: { key3: 3, key4: '4' } },
      { key2: { $between: [1, 100] } },
    ],
    $and: [
      { $or: { key3: 1, key4: 2 } },
      { key1: 1 },
    ],
  };
  assert.equal(
    builder.makeWhere(Model, condition),
    "(`id` = 1 AND `key2` = 2 AND ((`key3` = '1' AND `key4` = '2') OR ((`key3` = '2' OR `key4` = '3')) OR ((`key3` = '3' AND `key4` = '4')) OR (`key2` BETWEEN 1 AND 100)) AND (((`key3` = '1' OR `key4` = '2')) AND (`id` = 1)))",
  );
  const arrayCondition = [
    { key3: 1, key4: '2' },
    { $or: { key3: 2, key4: '3' } },
    { $and: { key3: 3, key4: '4' } },
  ];
  assert.equal(
    builder.makeArrayWhere(Model, arrayCondition, 'AND'),
    "((`key3` = '1' AND `key4` = '2') AND ((`key3` = '2' OR `key4` = '3')) AND ((`key3` = '3' AND `key4` = '4')))",
  );
  assert.equal(
    builder.makeArrayWhere(Model, arrayCondition, 'OR'),
    "((`key3` = '1' AND `key4` = '2') OR ((`key3` = '2' OR `key4` = '3')) OR ((`key3` = '3' AND `key4` = '4')))",
  );
});

test('v1 empty and invalid where inputs retain their guards', () => {
  assert.equal(builder.makeWhere(Model, {}), '()');
  assert.throws(() => builder.makeWhere(Model, { missing: 100 }), /missing/);
  assert.throws(
    () => builder.makeArrayWhere(
      Model,
      {} as unknown as readonly Readonly<Record<string, unknown>>[],
      'AND',
    ),
    /Non-array condition/,
  );
  assert.throws(() => builder.makeFieldWhere(Model, 'missing', 1), /no field named/);
  assert.equal(builder.makeFieldWhere(Model, 'key2', { $in: [] }), '`key2` IN ()');
  assert.equal(builder.makeFieldWhere(Model, 'key2', { $between: [1] }), '`key2` BETWEEN 1 AND NaN');
});

test('v1 order, limit, and index generation remains deterministic', () => {
  assert.equal(builder.makeOrder(Model, [{ key1: -1 }]), '`id` DESC');
  assert.equal(builder.makeOrder(Model, []), '');
  const legacyOrder = [
    { key1: -1 },
    { key2: 1 },
    { key3: 2 },
    { key4: -1 },
    { key5: '123' },
  ] as unknown as readonly Readonly<Record<string, 1 | -1>>[];
  assert.equal(
    builder.makeOrder(Model, legacyOrder),
    '`id` DESC, `key2` ASC, `key3` ASC, `key4` DESC, `key5` ASC',
  );
  assert.equal(builder.makeOrder(Model, [{}]), '');
  assert.throws(() => builder.makeOrder(Model, [{ missing: -1 }]), /no field/);
  assert.equal(builder.makeLimit(Model, [12_489, 4783]), '12489, 4783');
  assert.equal(builder.makeLimit(Model, [389]), '389');
  assert.equal(builder.makeLimit(Model, ['4389', '98347']), '4389, 98347');
  assert.equal(builder.makeLimit(Model, ['bad', 'values']), '0, 0');
  assert.equal(builder.makeIndex(Model, 'idx'), 'FORCE INDEX(`idx`)');
  assert.equal(builder.makeIndex(Model), '');
});

test('v1 find and count generation retains fields and clauses', () => {
  assert.equal(builder.makeFind(Model), 'SELECT * FROM `test_table`');
  assert.equal(builder.makeFind(Model, {}), 'SELECT * FROM `test_table`');
  assert.equal(
    builder.makeFind(Model, {
      fields: Model.schema.map((field) => field.name),
      where: { key1: 2 },
      order: [{ key2: 1 }],
      limit: [1, 10],
      index: 'idx',
    }),
    'SELECT `id`, `key2`, `key3`, `key4`, `key5`, `key6` FROM `test_table` FORCE INDEX(`idx`) WHERE (`id` = 2) ORDER BY `key2` ASC LIMIT 1, 10',
  );
  assert.equal(builder.makeFind(Model, { count: true, fields: ['key1'] }), 'SELECT COUNT(0) FROM `test_table`');
  assert.throws(() => builder.makeFind(Model, { fields: ['missing'] }), /no field named/);
  assert.equal(builder.makeSql('legacy-unknown', Model), builder.makeFind(Model));
});

test('v1 set and update preserve null, unknown fields, and raw expressions', () => {
  assert.equal(
    builder.makeSet(Model, { key1: 421, key2: 1.23, key3: { a: '123' }, key4: '123' }),
    "`id` = 421, `key2` = 1.23, `key3` = '{\\\"a\\\":\\\"123\\\"}', `key4` = '123'",
  );
  assert.equal(builder.makeSet(Model, {}), '');
  assert.equal(builder.makeSet(Model, { missing: 'ignored' }), '');
  assert.equal(
    builder.makeSet(Model, {
      key1: '{{key2 + 123}}',
      key3: '{{CONCAT("{\\"foo\\":\\"", key1, key4, "\\"}")}}',
      key4: '{{"123,456"}}',
      key6: { dec: 152 },
    }),
    '`id` = key2 + 123, `key3` = CONCAT("{\\"foo\\":\\"", id, key4, "\\"}"), `key4` = "123,456", `key6` = BIN(152)',
  );
  assert.equal(builder.makeSet(Model, { key4: null }), '`key4` = NULL');
  assert.equal(builder.makeSet(Model, { key1: null }), '`id` = NaN');
  assert.equal(
    builder.makeUpdate(Model, {
      update: { key1: 421, key4: '123' },
      where: { key1: 123, key4: '456' },
      index: 'idx',
    }),
    "UPDATE `test_table` FORCE INDEX(`idx`) SET `id` = 421, `key4` = '123' WHERE (`id` = 123 AND `key4` = '456')",
  );
  assert.equal(builder.makeUpdate(Model, { update: { key1: 1 } }), 'UPDATE `test_table` SET `id` = 1');
  assert.throws(() => builder.makeUpdate(Model, { where: { key1: 1 } }), /no set data/);
});

test('v1 delete generation retains order and MySQL limit restrictions', () => {
  assert.equal(
    builder.makeDelete(Model, {
      where: { key1: 421, key2: 1.23, key3: { a: '123' }, key4: '123' },
    }),
    "DELETE FROM `test_table` WHERE (`id` = 421 AND `key2` = 1.23 AND `key3` = '{\\\"a\\\":\\\"123\\\"}' AND `key4` = '123')",
  );
  assert.equal(
    builder.makeDelete(Model, { where: { key1: 1 }, order: [{ key2: -1 }], limit: [0, 1] }),
    'DELETE FROM `test_table` WHERE (`id` = 1) ORDER BY `key2` DESC LIMIT 1',
  );
  assert.equal(builder.makeDelete(Model), 'DELETE FROM `test_table`');
  assert.throws(() => builder.makeDelete(Model, { limit: [1, 1] }), /non-zero offset/);
});

test('compiled v1 scenarios bind data in deterministic order', () => {
  assert.deepEqual(
    builder.compileUpdate(Model, {
      update: { key3: { a: '123' }, key6: { dec: 7 }, key4: null },
      where: { key2: { $between: [1, 2] }, key1: { $in: [3, 4] } },
    }),
    {
      sql: 'UPDATE `test_table` SET `key3` = ?, `key6` = BIN(7), `key4` = NULL WHERE (`key2` BETWEEN ? AND ? AND `id` IN (?, ?))',
      values: ['{"a":"123"}', 1, 2, 3, 4],
    },
  );
});
