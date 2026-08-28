import {
  RedisCache,
  create,
  type RedisCacheOptions,
} from '../../src';

const options: RedisCacheOptions = { prefix: 'app:' };
const direct: RedisCache = new RedisCache('127.0.0.1:6379', options);
const created: RedisCache = create('127.0.0.1:6379', options);
const rows: Promise<unknown[]> = direct.getData('database', 'records', [1, 2]);

void created;
void rows;
