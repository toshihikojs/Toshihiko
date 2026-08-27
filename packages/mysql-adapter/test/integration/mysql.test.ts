import assert from 'node:assert/strict';
import test from 'node:test';
import { Toshihiko, Type } from 'toshihiko';
import { MySQLAdapter } from '../..';

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
  const inserted = await User.build({ name: 'Alice', score: 1.5 }).insert();
  assert.equal(inserted.$source, 'query');
  assert.deepEqual(inserted.toJSON(), { id: 1, name: 'Alice', score: 1.5 });
  assert.deepEqual(inserted.changes(), []);

  const rows = await User.where({ score: { $gte: 1 } }).order({ id: -1 }).find(true);
  assert.deepEqual(rows, [{ id: 1, name: 'Alice', score: 1.5 }]);
  assert.equal(await adapter.count(User.where({ name: 'Alice' })), 1);

  inserted.score = 2.5;
  const updatedYukari = await inserted.update();
  assert.equal(updatedYukari, inserted);
  assert.deepEqual(inserted.changes(), []);
  const updated = await User.findById(1, true);
  assert.notEqual(updated, null);
  assert.equal(updated?.score, 2.5);

  const connection = await adapter.beginTransaction();
  await adapter.execute(connection, 'INSERT INTO `users` (`display_name`, `score`) VALUES (?, ?)', ['Rolled back', 3]);
  await adapter.rollback(connection);
  assert.equal(await adapter.count(User.where({ name: 'Rolled back' })), 0);

  const query = User.where({ id: 1 });
  const deletion = await adapter.deleteByQuery(query);
  assert.equal(deletion.affectedRows, 1);
  assert.equal(await User.findById(1, true), null);

  inserted.name = 'Stale';
  await assert.rejects(inserted.update(), /Out-dated yukari data/);
  assert.deepEqual(inserted.toJSON(true), { id: 1, name: 'Alice', score: 2.5 });
});
