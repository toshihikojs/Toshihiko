'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { MySQLAdapter } = require('../..');
const { Toshihiko, Type } = require('toshihiko');

const database = process.env.MYSQL_DATABASE ?? 'toshihiko_test';
const adapter = new MySQLAdapter({
  database,
  host: process.env.MYSQL_HOST ?? '127.0.0.1',
  password: process.env.MYSQL_PASSWORD ?? 'toshihiko',
  port: Number(process.env.MYSQL_PORT ?? 3306),
  username: process.env.MYSQL_USER ?? 'root',
});
const toshihiko = new Toshihiko(adapter);
const User = toshihiko.define('users', [
  { name: 'id', column: 'user_id', type: Type.Integer, primaryKey: true, autoIncrement: true },
  { name: 'name', column: 'display_name', type: Type.String },
  { name: 'score', type: Type.Float },
]);

test.before(async () => {
  await adapter.execute('DROP TABLE IF EXISTS `users`');
  await adapter.execute(`
    CREATE TABLE \`users\` (
      \`user_id\` INT NOT NULL AUTO_INCREMENT,
      \`display_name\` VARCHAR(255) NOT NULL,
      \`score\` DOUBLE NOT NULL,
      PRIMARY KEY (\`user_id\`)
    ) ENGINE=InnoDB
  `);
});

test.after(async () => {
  await adapter.execute('DROP TABLE IF EXISTS `users`');
  await adapter.close();
});

test('read, write, raw execution, and transactions work end to end', async () => {
  const inserted = await adapter.insert(User, null, [
    { field: User.fieldNamesMap.name, value: 'Alice' },
    { field: User.fieldNamesMap.score, value: 1.5 },
  ]);
  assert.equal(inserted.display_name, 'Alice');

  const rows = await User.where({ score: { $gte: 1 } }).order({ id: -1 }).find(true);
  assert.deepEqual(rows, [{ id: 1, name: 'Alice', score: 1.5 }]);
  assert.equal(await adapter.count(User.where({ name: 'Alice' })), 1);

  const mutation = await adapter.update(User, null, { id: 1 }, [
    { field: User.fieldNamesMap.score, value: 2.5 },
  ]);
  assert.equal(mutation.affectedRows, 1);
  assert.equal((await User.findById(1, true)).score, 2.5);

  const connection = await adapter.beginTransaction();
  await adapter.execute(connection, 'INSERT INTO `users` (`display_name`, `score`) VALUES (?, ?)', ['Rolled back', 3]);
  await adapter.rollback(connection);
  assert.equal(await adapter.count(User.where({ name: 'Rolled back' })), 0);

  const query = User.where({ id: 1 });
  const deletion = await adapter.deleteByQuery(query);
  assert.equal(deletion.affectedRows, 1);
  assert.equal(await User.findById(1, true), null);
});
