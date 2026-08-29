import assert from 'node:assert/strict';
import test from 'node:test';
import { Toshihiko, Type, type FieldType } from 'toshihiko';
import { MySQLAdapter } from '../..';
import { dataFor } from '../helpers/mysql';

const database = process.env.MYSQL_DATABASE ?? 'toshihiko_test';
const adapter = new MySQLAdapter({
  database,
  host: process.env.MYSQL_HOST ?? '127.0.0.1',
  password: process.env.MYSQL_PASSWORD ?? 'toshihiko',
  port: Number(process.env.MYSQL_PORT ?? 3306),
  username: process.env.MYSQL_USER ?? 'root',
});
const toshihiko = new Toshihiko(adapter);
const legacyDate = new Date(2026, 0, 2, 3, 4, 5);

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

const Record = toshihiko.define('legacy_records', [
  { name: 'id', type: Type.Integer, primaryKey: true, autoIncrement: true },
  { name: 'score', type: Type.Float },
  { name: 'payload', type: Type.Json },
  { name: 'name', type: Type.String, allowNull: true },
  { name: 'createdAt', column: 'created_at', type: Type.Datetime },
  { name: 'bits', type: BinaryType },
]);
const Composite = toshihiko.define('legacy_composite', [
  { name: 'tenant', type: Type.String, primaryKey: true },
  { name: 'code', type: Type.Integer, primaryKey: true },
  { name: 'value', type: Type.String },
]);
const Plain = toshihiko.define('legacy_plain', [
  { name: 'code', type: Type.Integer },
  { name: 'value', type: Type.String },
]);

test.before(async () => {
  await adapter.execute('DROP TABLE IF EXISTS `legacy_records`, `legacy_composite`, `legacy_plain`, `legacy_tx`');
  await adapter.execute(`
    CREATE TABLE \`legacy_records\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`score\` DOUBLE NOT NULL,
      \`payload\` LONGTEXT NOT NULL,
      \`name\` VARCHAR(255) NULL,
      \`created_at\` DATETIME NOT NULL,
      \`bits\` VARCHAR(255) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB
  `);
  await adapter.execute(`
    CREATE TABLE \`legacy_composite\` (
      \`tenant\` VARCHAR(64) NOT NULL,
      \`code\` INT NOT NULL,
      \`value\` VARCHAR(255) NOT NULL,
      PRIMARY KEY (\`tenant\`, \`code\`)
    ) ENGINE=InnoDB
  `);
  await adapter.execute(`
    CREATE TABLE \`legacy_plain\` (
      \`code\` INT NOT NULL,
      \`value\` VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB
  `);
  await adapter.execute('CREATE TABLE `legacy_tx` (`id` INT NOT NULL PRIMARY KEY) ENGINE=InnoDB');
});

test.after(async () => {
  await adapter.execute('DROP TABLE IF EXISTS `legacy_records`, `legacy_composite`, `legacy_plain`, `legacy_tx`');
  await adapter.mysql.end();
});

test('v1 insert/readback restores JSON, datetime, null, and custom SQL types', async () => {
  const row = await adapter.insert(Record, null, dataFor(Record, {
    score: 0.5,
    payload: { foo: 'bar' },
    name: null,
    createdAt: legacyDate,
    bits: { dec: 168 },
  }));

  assert.equal(row.id, 1);
  assert.equal(row.score, 0.5);
  assert.deepEqual(row.payload, { foo: 'bar' });
  assert.equal(row.name, null);
  const createdAt = row.createdAt;
  assert.ok(createdAt instanceof Date);
  assert.equal(createdAt.getTime(), legacyDate.getTime());
  assert.deepEqual(row.bits, { dec: 168 });
});

test('v1 complex field and where operators return the intended rows', async () => {
  await adapter.insert(Record, null, dataFor(Record, {
    score: 1.5,
    payload: { index: 2 },
    name: 'Alice',
    createdAt: legacyDate,
    bits: { dec: 2 },
  }));
  await adapter.insert(Record, null, dataFor(Record, {
    score: 2.5,
    payload: { index: 3 },
    name: 'Bob',
    createdAt: legacyDate,
    bits: { dec: 3 },
  }));

  const rows = await Record.where({
    score: { $between: [1, 3], $neq: 1.5 },
    $or: [{ name: { $like: 'B%' } }, { id: { $in: [99] } }],
  }).order({ id: -1 }).find(true);
  assert.deepEqual(rows.map((row) => row.name), ['Bob']);
  assert.equal(await Record.where({ id: { $gte: 2 } }).count(), 2);
});

test('v1 single-row limit variants preserve offset and empty behavior', async () => {
  const first = await Record.order({ id: 1 }).findOne(true);
  const limited = await Record.order({ id: 1 }).limit(2).findOne(true);
  const offset = await Record.order({ id: 1 }).limit(1, 100).findOne(true);
  assert.notEqual(first, null);
  assert.notEqual(limited, null);
  assert.notEqual(offset, null);
  assert.equal(first?.id, 1);
  assert.equal(limited?.id, 1);
  assert.equal(offset?.id, 2);
  assert.equal(await Record.order({ id: 1 }).limit(100, 100).findOne(true), null);
});

test('v1 insert reads composite and keyless rows back deterministically', async () => {
  const composite = await adapter.insert(Composite, null, dataFor(Composite, {
    tenant: 'east',
    code: 7,
    value: 'composite',
  }));
  assert.deepEqual({ ...composite }, { tenant: 'east', code: 7, value: 'composite' });

  const plain = await adapter.insert(Plain, null, dataFor(Plain, {
    code: 8,
    value: 'plain',
  }));
  assert.deepEqual({ ...plain }, { code: 8, value: 'plain' });
});

test('v1 update and updateByQuery preserve typed and raw values', async () => {
  const mutation = await adapter.update(Record, null, { id: 1 }, dataFor(Record, {
    score: 4.5,
    bits: { dec: 15 },
  }));
  assert.equal(mutation.affectedRows, 1);
  assert.deepEqual({ ...await Record.findById(1) }, {
    id: 1,
    score: 4.5,
    payload: { foo: 'bar' },
    name: null,
    createdAt: legacyDate,
    bits: { dec: 15 },
  });

  const query = Record.where({ id: { $gte: 2 } }).order({ id: 1 }).limit(1);
  assert.equal((await query.update({ name: 'updated' })).affectedRows, 1);
  const updated = await Record.findById(2, true);
  const untouched = await Record.findById(3, true);
  assert.notEqual(updated, null);
  assert.notEqual(untouched, null);
  assert.equal(updated?.name, 'updated');
  assert.equal(untouched?.name, 'Bob');
});

test('v1 deleteByQuery respects ordering and row-count limit', async () => {
  const query = Record.where({ id: { $gte: 2 } }).order({ id: -1 }).limit(0, 1);
  assert.equal((await query.delete()).affectedRows, 1);
  assert.equal(await Record.findById(3, true), null);
  assert.notEqual(await Record.findById(2, true), null);
});

test('v1 transaction commit and rollback isolate writes on one connection', async () => {
  const committed = await adapter.beginTransaction();
  await adapter.execute(committed, 'INSERT INTO `legacy_tx` (`id`) VALUES (?)', [1]);
  await adapter.execute(committed, 'INSERT INTO `legacy_tx` (`id`) VALUES (?)', [2]);
  await adapter.commit(committed);

  const rolledBack = await adapter.beginTransaction();
  await adapter.execute(rolledBack, 'INSERT INTO `legacy_tx` (`id`) VALUES (?)', [3]);
  await adapter.execute(rolledBack, 'INSERT INTO `legacy_tx` (`id`) VALUES (?)', [4]);
  await adapter.rollback(rolledBack);

  const rows = await adapter.execute('SELECT `id` FROM `legacy_tx` ORDER BY `id` ASC');
  assert.ok(Array.isArray(rows));
  assert.deepEqual(rows.map((row: unknown) => {
    assert.ok(typeof row === 'object' && row !== null && 'id' in row);
    return row.id;
  }), [1, 2]);
});
