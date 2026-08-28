import {
  Cache,
  type CacheKey,
} from '../..';
import type { Cache as CacheContract } from 'toshihiko';

interface CachedRow {
  readonly value: string;
}

class PublishedCache extends Cache {
  override async deleteData(): Promise<void> {}

  override async deleteKeys(): Promise<void> {}

  override async getData<Value extends object>(
    _database: string,
    _table: string,
    _keys: CacheKey | readonly CacheKey[],
  ): Promise<(Value | null)[]> {
    return [{ value: 'cached' } as Value];
  }

  override async setData<Value extends object>(
    _database: string,
    _table: string,
    _key: CacheKey,
    _data: Value,
  ): Promise<void> {}
}

const cache: CacheContract = new PublishedCache();
const rows: Promise<(CachedRow | null)[]> = cache.getData<CachedRow>('database', 'records', 1);

void rows;
