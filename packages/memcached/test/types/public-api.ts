import {
  MemcachedCache,
  create,
  type CustomizeKey,
  type MemcachedCacheOptions,
} from '../../src';

const customizeKey: CustomizeKey = function(database, table, key) {
  return `${this.prefix}${database}:${table}:${String(key)}`;
};
const options: MemcachedCacheOptions = { customizeKey, prefix: 'app:' };
const direct: MemcachedCache = new MemcachedCache('127.0.0.1:11211', options);
const created: MemcachedCache = create('127.0.0.1:11211', options);
const rows: Promise<(Readonly<{ id: number }> | null)[]> = direct.getData<
  Readonly<{ id: number }>
>('database', 'records', [1, 2]);

void created;
void rows;
