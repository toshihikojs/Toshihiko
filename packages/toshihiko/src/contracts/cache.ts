import type { DataValue } from './common';

/**
 * A single lookup key accepted by Cache implementations.
 * @zh Cache 实现接受的单个查询 key。
 * @ja Cache 実装が受け付ける 1 個の検索キーです。
 */
export type CacheKey =
  | object
  | string
  | number
  | bigint
  | boolean
  | symbol
  | null
  | undefined;

/**
 * Backend-specific result returned when deleting one cached row.
 * @zh 删除一行缓存后返回的后端特有结果。
 * @ja キャッシュされた 1 行を削除したときに返す、バックエンド固有の結果です。
 */
export type CacheDeleteResult = void | boolean | number;
/**
 * Backend-specific result returned when deleting multiple cached rows.
 * @zh 删除多行缓存后返回的后端特有结果。
 * @ja キャッシュされた複数行を削除したときに返す、バックエンド固有の結果です。
 */
export type CacheDeleteKeysResult = void | readonly number[];
/**
 * Backend-specific result returned after writing one cached row.
 * @zh 写入一行缓存后返回的后端特有结果。
 * @ja キャッシュされた 1 行を書き込んだ後に返す、バックエンド固有の結果です。
 */
export type CacheSetResult = void | boolean | 'OK' | null;

/**
 * Contract implemented by a Toshihiko cache backend.
 * @zh Toshihiko Cache 后端实现的契约。
 * @ja Toshihiko の Cache バックエンドが実装する契約です。
 * @category Extension API
 * @zh 扩展 API
 * @ja 拡張 API
 */
export interface Cache {
  /**
   * Deletes one cached row.
   * @zh 删除一行缓存数据。
   * @ja キャッシュされた 1 行を削除します。
   * @param database - Database namespace.
   * @zh database - 数据库命名空间。
   * @ja database - データベースの名前空間です。
   * @param table - Model or table namespace.
   * @zh table - Model 或表的命名空间。
   * @ja table - Model またはテーブルの名前空間です。
   * @param key - Row locator or serialized backend key.
   * @zh key - 数据行定位条件或序列化后的后端 key。
   * @ja key - データ行を特定する条件、またはシリアライズ済みのバックエンドキーです。
   */
  deleteData(
    database: string,
    table: string,
    key: CacheKey,
  ): Promise<CacheDeleteResult>;
  /**
   * Deletes cached rows for multiple keys.
   * @zh 删除多个 key 对应的缓存数据行。
   * @ja 複数のキーに対応するキャッシュ済みデータ行を削除します。
   * @param database - Database namespace.
   * @zh database - 数据库命名空间。
   * @ja database - データベースの名前空間です。
   * @param table - Model or table namespace.
   * @zh table - Model 或表的命名空间。
   * @ja table - Model またはテーブルの名前空間です。
   * @param keys - Keys to invalidate.
   * @zh keys - 需要失效的 key。
   * @ja keys - 無効化するキーです。
   */
  deleteKeys(
    database: string,
    table: string,
    keys: readonly CacheKey[],
  ): Promise<CacheDeleteKeysResult>;
  /**
   * Reads one or more cached rows.
   *
   * The returned array preserves request order; a cache miss occupies its slot
   * as `null`.
   * @zh 读取一行或多行缓存数据。
   *
   * 返回数组保持请求顺序；缓存未命中会在对应位置使用 `null`。
   * @ja キャッシュされた 1 行または複数行を読み取ります。
   *
   * 返す配列は要求時の順序を維持します。キャッシュミスの位置には `null` が入ります。
   * @param database - Database namespace.
   * @zh database - 数据库命名空间。
   * @ja database - データベースの名前空間です。
   * @param table - Model or table namespace.
   * @zh table - Model 或表的命名空间。
   * @ja table - Model またはテーブルの名前空間です。
   * @param keys - One key or an ordered list of keys.
   * @zh keys - 一个 key 或按顺序排列的 key 列表。
   * @ja keys - 1 個のキー、または順序付きのキー一覧です。
   */
  getData<Value extends object>(
    database: string,
    table: string,
    keys: CacheKey | readonly CacheKey[],
  ): Promise<(Value | null)[]>;
  /**
   * Stores one serialized row.
   * @zh 存储一行序列化数据。
   * @ja シリアライズ済みの 1 行を保存します。
   * @param database - Database namespace.
   * @zh database - 数据库命名空间。
   * @ja database - データベースの名前空間です。
   * @param table - Model or table namespace.
   * @zh table - Model 或表的命名空间。
   * @ja table - Model またはテーブルの名前空間です。
   * @param key - Row locator or serialized backend key.
   * @zh key - 数据行定位条件或序列化后的后端 key。
   * @ja key - データ行を特定する条件、またはシリアライズ済みのバックエンドキーです。
   * @param data - Plain row data to cache.
   * @zh data - 要缓存的普通数据行。
   * @ja data - Cache に保存する、通常のオブジェクト形式のデータ行です。
   */
  setData<Value extends object>(
    database: string,
    table: string,
    key: CacheKey,
    data: Value,
  ): Promise<CacheSetResult>;
}

/**
 * Legacy module shape used by {@link Toshihiko.createCache}.
 * @zh 以下方法使用的旧版模块结构：{@link Toshihiko.createCache}。
 * @ja {@link Toshihiko.createCache} が使用する旧形式のモジュール構造です。
 */
export interface CacheModule {
  /**
   * Creates a Cache from positional configuration values.
   * @zh 从位置参数配置创建 Cache。
   * @ja 位置指定の設定値から Cache を作成します。
   */
  create(...arguments_: DataValue[]): Cache;
}

/**
 * Module-style Cache configuration retained for v1 compatibility.
 * @zh 为兼容 v1 保留的模块式 Cache 配置。
 * @ja v1 との互換性のために維持する、モジュール形式の Cache 設定です。
 */
export interface CacheOptions {
  readonly [key: string]: DataValue;
  /**
   * Already loaded module exposing a Cache factory.
   * @zh 已经加载、并公开 Cache 工厂函数的模块。
   * @ja Cache ファクトリーを公開する、読み込み済みのモジュールです。
   */
  readonly module?: CacheModule;
  /**
   * Package suffix resolved as `@toshihiko/{name}-cache`.
   * @zh 解析为以下名称的软件包后缀：`@toshihiko/{name}-cache`。
   * @ja `@toshihiko/{name}-cache` として解決するパッケージ名の接尾辞です。
   */
  readonly name?: string;
  /**
   * Module path loaded with `require()`.
   * @zh 通过以下方法加载的模块路径：`require()`。
   * @ja `require()` で読み込むモジュールパスです。
   */
  readonly path?: string;
}

/**
 * Existing Cache instance or module-style Cache configuration.
 * @zh 现有 Cache 实例或模块式 Cache 配置。
 * @ja 既存の Cache インスタンス、またはモジュール形式の Cache 設定です。
 */
export type CacheSource = Cache | CacheOptions;

const stripComments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
const argumentNames = /([^\s,]+)/g;

export function createCache(source: CacheSource): Cache | null {
  if (isCache(source)) return source;

  const options = source;
  let cacheModule: CacheModule;
  if (options.module) {
    cacheModule = options.module;
  } else if (options.path) {
    cacheModule = require(options.path) as CacheModule;
  } else if (options.name) {
    cacheModule = require(`@toshihiko/${options.name}-cache`) as CacheModule;
  } else {
    return null;
  }

  const names = getParameterNames(cacheModule.create);
  return cacheModule.create(...names.map((name) => options[name]));
}

export function isCache<Value>(value: Value): value is Value & Cache {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
    return false;
  }
  const candidate = value as Partial<Cache>;
  return typeof candidate.deleteData === 'function'
    && typeof candidate.deleteKeys === 'function'
    && typeof candidate.getData === 'function'
    && typeof candidate.setData === 'function';
}

function getParameterNames(func: (...arguments_: DataValue[]) => Cache): string[] {
  const source = func.toString().replace(stripComments, '');
  const result = source
    .slice(source.indexOf('(') + 1, source.indexOf(')'))
    .match(argumentNames);
  return result === null ? [] : result;
}
