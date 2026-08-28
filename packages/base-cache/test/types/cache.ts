import {
  Cache,
  type CacheContract,
  type CacheKey,
} from '../../src';

interface Row {
  readonly id: number;
}

class MemoryCache extends Cache<Row> {
  override async deleteData(
    _database: string,
    _table: string,
    _key: CacheKey,
  ): Promise<void> {}

  override async deleteKeys(
    _database: string,
    _table: string,
    _keys: readonly CacheKey[],
  ): Promise<void> {}

  override async getData(): Promise<Row[]> {
    return [{ id: 1 }];
  }

  override async setData(
    _database: string,
    _table: string,
    _key: CacheKey,
    _data: Row,
  ): Promise<void> {}
}

const cache: CacheContract<Row> = new MemoryCache();
const rows: Promise<Row[]> = cache.getData('database', 'records', [1]);

void rows;
