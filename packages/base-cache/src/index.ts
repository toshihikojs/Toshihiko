import { EventEmitter } from 'node:events';
import type {
  Cache as ToshihikoCacheContract,
  CacheDeleteKeysResult as CacheDeleteKeysResultContract,
  CacheDeleteResult as CacheDeleteResultContract,
  CacheKey as CacheKeyContract,
  CacheSetResult as CacheSetResultContract,
} from 'toshihiko';

/**
 * Lookup key accepted by Cache implementations.
 * @zh Cache 实现接受的查询 key。
 * @ja Cache 実装が受け付ける検索キーです。
 */
export type CacheKey = CacheKeyContract;

/**
 * Result returned after deleting one cached row.
 * @zh 删除一行缓存数据后返回的结果。
 * @ja キャッシュされた 1 行を削除した後に返す結果です。
 */
export type CacheDeleteResult = CacheDeleteResultContract;

/**
 * Result returned after deleting multiple cached rows.
 * @zh 删除多行缓存数据后返回的结果。
 * @ja キャッシュされた複数行を削除した後に返す結果です。
 */
export type CacheDeleteKeysResult = CacheDeleteKeysResultContract;

/**
 * Result returned after writing one cached row.
 * @zh 写入一行缓存数据后返回的结果。
 * @ja キャッシュされた 1 行を書き込んだ後に返す結果です。
 */
export type CacheSetResult = CacheSetResultContract;

/**
 * Structural contract implemented by Toshihiko Cache backends.
 * @zh Toshihiko Cache 后端实现的结构契约。
 * @ja Toshihiko の Cache バックエンドが実装する構造的な契約です。
 */
export type CacheContract = ToshihikoCacheContract;

/**
 * Base class for Toshihiko cache implementations.
 * @zh Toshihiko Cache 实现的基类。
 * @ja Toshihiko の Cache 実装の基底クラスです。
 * @category Extension API
 * @zh 扩展 API
 * @ja 拡張 API
 */
export abstract class Cache
  extends EventEmitter
  implements ToshihikoCacheContract {
  /**
   * Deletes one cached row.
   * @zh 删除一行缓存数据。
   * @ja キャッシュされた 1 行を削除します。
   */
  abstract deleteData(
    database: string,
    table: string,
    key: CacheKey,
  ): Promise<CacheDeleteResult>;

  /**
   * Deletes cached rows for multiple keys.
   * @zh 删除多个 key 对应的缓存数据行。
   * @ja 複数のキーに対応するキャッシュ済みデータ行を削除します。
   */
  abstract deleteKeys(
    database: string,
    table: string,
    keys: readonly CacheKey[],
  ): Promise<CacheDeleteKeysResult>;

  /**
   * Reads cached rows in request order, using `null` for a cache miss.
   * @zh 按请求顺序读取缓存数据行，并使用 `null` 表示缓存未命中。
   * @ja 要求時の順序でキャッシュ済みデータ行を読み取り、キャッシュミスには `null` を使用します。
   */
  abstract getData<Value extends object>(
    database: string,
    table: string,
    keys: CacheKey | readonly CacheKey[],
  ): Promise<(Value | null)[]>;

  /**
   * Stores one serialized row under a Cache key.
   * @zh 在 Cache key 下存储一行序列化数据。
   * @ja Cache キーの下にシリアライズ済みの 1 行を保存します。
   */
  abstract setData<Value extends object>(
    database: string,
    table: string,
    key: CacheKey,
    data: Value,
  ): Promise<CacheSetResult>;
}
