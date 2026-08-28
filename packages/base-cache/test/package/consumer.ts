import {
  Cache,
  type CacheKey,
} from '../..';
import type { Cache as CacheContract } from 'toshihiko';

class PublishedCache extends Cache<string> {
  override async deleteData(): Promise<void> {}

  override async deleteKeys(): Promise<void> {}

  override async getData(
    _database: string,
    _table: string,
    _keys: CacheKey | readonly CacheKey[],
  ): Promise<string[]> {
    return ['cached'];
  }

  override async setData(): Promise<void> {}
}

const cache: CacheContract<string> = new PublishedCache();
const rows: Promise<string[]> = cache.getData('database', 'records', 1);

void rows;
