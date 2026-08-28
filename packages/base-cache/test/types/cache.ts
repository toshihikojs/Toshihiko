import {
  Cache,
  type CacheContract,
  type CacheKey,
} from '../../src';

interface Row {
  readonly id: number;
}

class MemoryCache extends Cache {
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

  override async getData<Value extends object>(): Promise<(Value | null)[]> {
    return [{ id: 1 } as Value];
  }

  override async setData<Value extends object>(
    _database: string,
    _table: string,
    _key: CacheKey,
    _data: Value,
  ): Promise<void> {}
}

const cache: CacheContract = new MemoryCache();
const rows: Promise<(Row | null)[]> = cache.getData<Row>('database', 'records', [1]);

void rows;
