import assert from 'node:assert/strict';
import test from 'node:test';
import { MySQLAdapter } from '../../../mysql-adapter';
import { Toshihiko, Type } from 'toshihiko';
import { MemcachedCache } from '../../dist';

const table = 'cache_records';
const database = process.env.MYSQL_DATABASE ?? 'toshihiko_test';
const adapter = new MySQLAdapter({
  database,
  host: process.env.MYSQL_HOST ?? '127.0.0.1',
  password: process.env.MYSQL_PASSWORD ?? 'toshihiko',
  port: Number(process.env.MYSQL_PORT ?? 3306),
  username: process.env.MYSQL_USER ?? 'root',
});
const cache = new MemcachedCache(
  `${process.env.MEMCACHED_HOST ?? '127.0.0.1'}:${process.env.MEMCACHED_PORT ?? '11211'}`,
  { prefix: `__toshihiko_mysql_${process.pid}__` },
);
const Record = new Toshihiko(adapter).define(table, [
  { name: 'id', column: 'record_id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
], { cache });

test.before(async () => {
  await adapter.execute(`DROP TABLE IF EXISTS \`${table}\``);
  await adapter.execute(`
    CREATE TABLE \`${table}\` (
      \`record_id\` INT NOT NULL,
      \`name\` VARCHAR(255) NOT NULL,
      PRIMARY KEY (\`record_id\`)
    ) ENGINE=InnoDB
  `);
  await adapter.execute(
    `INSERT INTO \`${table}\` (\`record_id\`, \`name\`) VALUES (?, ?), (?, ?)`,
    [1, 'first', 2, 'second'],
  );
});

test.after(async () => {
  await adapter.execute(`DROP TABLE IF EXISTS \`${table}\``);
  cache.memcached.end();
  await adapter.mysql.end();
});

test('v1 MySQL and Memcached cooperate for reads and invalidation', async () => {
  const firstRead = await Record.order({ id: 1 }).find();
  assert.deepEqual(firstRead.map((row) => row.toJSON()), [
    { id: 1, name: 'first' },
    { id: 2, name: 'second' },
  ]);
  await adapter.execute(
    `UPDATE \`${table}\` SET \`name\` = ? WHERE \`record_id\` = ?`,
    ['changed outside Toshihiko', 1],
  );

  const cachedRead = await Record.order({ id: 1 }).find();
  assert.deepEqual(cachedRead.map((row) => row.toJSON()), [
    { id: 1, name: 'first' },
    { id: 2, name: 'second' },
  ]);

  const first = await Record.findById(1);
  assert.notEqual(first, null);
  first!.name = 'updated';
  await first!.save();

  const updated = await Record.findById(1);
  assert.equal(updated?.name, 'updated');
  assert.equal((await Record.where({ id: 2 }).delete()).affectedRows, 1);
  assert.equal(await Record.findById(2), null);
});
