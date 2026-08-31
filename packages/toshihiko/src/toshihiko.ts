import { EventEmitter2 } from 'eventemitter2';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import {
  Model,
  type ModelDefinitionOptions,
} from './contracts/model';
import type {
  Field,
  FieldDefinitionValue,
  SchemaDefinition,
  ValidatedSchema,
} from './contracts/field';
import type {
  Adapter,
  AdapterConnection,
  AdapterConstructor,
  AdapterCountQueryType,
  AdapterDeleteQueryType,
  AdapterExecuteArguments,
  AdapterExecuteResult,
  AdapterField,
  AdapterLike,
  AdapterModel,
  AdapterQueryType,
  AdapterSource,
  AdapterUpdateConnection,
  AdapterUpdateField,
  AdapterUpdateByQueryType,
  AdapterUpdateModel,
  AdapterUpdateValue,
  AdapterValue,
} from './contracts/adapter';
import type { QueryAdapterData } from './query';
import {
  createCache,
  type Cache,
  type CacheSource,
} from './contracts/cache';

/**
 * Default option constraint used when an Adapter does not declare its own.
 * @zh Adapter 未声明自身约束时使用的默认选项约束。
 * @ja Adapter が独自の制約を宣言していない場合に使用する既定のオプション制約です。
 */
export type ToshihikoOptions = object;

const adapterInstances = new WeakMap<object, AdapterLike>();

type IsAdapterCompatible<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike,
> = false extends
  | IsAssignableWhenUsed<
    Model<Name, Schema, AdapterInstance>,
    AdapterModel<AdapterInstance>
  >
  | IsAssignableWhenUsed<
    QueryAdapterData<Name, Schema, AdapterInstance>,
    AdapterQueryType<AdapterInstance>
  >
  | IsAssignableWhenUsed<
    QueryAdapterData<Name, Schema, AdapterInstance>,
    AdapterCountQueryType<AdapterInstance>
  >
  | IsAssignableWhenUsed<
    Field<Schema[number]>,
    AdapterField<AdapterInstance>
  >
  | IsAssignableWhenUsed<
    FieldDefinitionValue<Schema[number]>,
    AdapterValue<AdapterInstance>
  >
  | IsAssignableWhenUsed<
    Model<Name, Schema, AdapterInstance>,
    AdapterUpdateModel<AdapterInstance>
  >
  | IsAssignableWhenUsed<
    AdapterConnection<AdapterInstance>,
    AdapterUpdateConnection<AdapterInstance>
  >
  | IsAssignableWhenUsed<
    Field<Schema[number]>,
    AdapterUpdateField<AdapterInstance>
  >
  | IsAssignableWhenUsed<
    FieldDefinitionValue<Schema[number]>,
    AdapterUpdateValue<AdapterInstance>
  >
  | IsAssignableWhenUsed<
    QueryAdapterData<Name, Schema, AdapterInstance>,
    AdapterDeleteQueryType<AdapterInstance>
  >
  | IsAssignableWhenUsed<
    QueryAdapterData<Name, Schema, AdapterInstance>,
    AdapterUpdateByQueryType<AdapterInstance>
  >
  ? false
  : true;

type IsAssignableWhenUsed<Actual, Expected> = [Expected] extends [never]
  ? true
  : Actual extends Expected ? true : false;

type IsValidDefinition<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike,
> = NoInfer<Schema> extends ValidatedSchema<NoInfer<Schema>>
  ? IsAdapterCompatible<Name, NoInfer<Schema>, AdapterInstance>
  : false;

/**
 * The database entry point used to define models and execute Adapter-level
 * operations.
 *
 * Construct it with an Adapter name, constructor, or instance. The selected
 * Adapter determines the option, connection, and execution-result types carried
 * into Models and Queries.
 * @zh 用于定义 Model 和执行 Adapter 层操作的数据库入口。
 *
 * 可以使用 Adapter 名称、构造函数或实例来构造。所选 Adapter 决定传入 Model 和 Query 的选项、连接及执行结果类型。
 * @ja Model の定義と Adapter レベルの操作を行う、データベースの入口です。
 *
 * Adapter の名前、コンストラクター、またはインスタンスを指定して構築します。選択した Adapter によって、Model と Query に伝播するオプション、接続、実行結果の型が決まります。
 * @category Application API
 * @zh 应用 API
 * @ja アプリケーション API
 */
export class Toshihiko<
  AdapterInstance extends AdapterLike = Adapter,
  Options extends object = ToshihikoOptions,
> extends EventEmitter2 {
  /**
   * Cache created from `options.cache`, when configured.
   * @zh 由以下配置创建的 Cache：`options.cache`（如果已配置）。
   * @ja 設定されている場合、`options.cache` から作成した Cache です。
   */
  declare readonly cache: Cache | null | undefined;
  /**
   * Adapter name or constructor name used for this instance.
   * @zh 此实例使用的 Adapter 名称或构造函数名。
   * @ja このインスタンスで使用する Adapter 名またはコンストラクター名です。
   */
  readonly dialect: string | null;
  /**
   * Adapter-specific options supplied to the constructor.
   * @zh 传给构造函数的 Adapter 特有选项。
   * @ja コンストラクターへ渡した Adapter 固有のオプションです。
   */
  readonly options: Options;
  /**
   * MySQL connection pool when exposed by the selected Adapter.
   * @zh 所选 Adapter 公开的 MySQL 连接池。
   * @ja 選択された Adapter が公開している場合の MySQL 接続 Pool です。
   */
  declare readonly pool: AdapterInstance extends { readonly mysql: infer Pool }
    ? Pool
    : undefined;

  constructor(
    adapter: string,
    ...[options]: {} extends Options
      ? readonly [options?: Options]
      : readonly [options: Options]
  );
  constructor(
    adapter: AdapterInstance | AdapterConstructor<Options, AdapterInstance>,
    ...[options]: {} extends Options
      ? readonly [options?: Options]
      : readonly [options: Options]
  );
  constructor(
    adapter: AdapterSource<Options, AdapterInstance>,
    ...[options]: {} extends Options
      ? readonly [options?: Options]
      : readonly [options: Options]
  );
  constructor(
    adapter: AdapterSource<Options, AdapterInstance>,
    ...[options]: {} extends Options
      ? readonly [options?: Options]
      : readonly [options: Options]
  ) {
    super();
    this.options = (options ?? {}) as Options;

    let adapterInstance: AdapterInstance;

    if (typeof adapter === 'string') {
      const Constructor = loadAdapter<Options, AdapterInstance>(adapter);
      adapterInstance = new Constructor(this, this.options);
      this.dialect = adapter;
    } else if (typeof adapter === 'function') {
      const Constructor = adapter as AdapterConstructor<Options, AdapterInstance>;
      adapterInstance = new Constructor(this, this.options);
      this.dialect = Constructor.name || null;
    } else {
      adapterInstance = adapter;
      this.dialect = adapter.constructor.name || null;
    }

    adapterInstances.set(this, adapterInstance);
    attachAdapterCompatibility(this, adapterInstance);

    const cacheSource = (this.options as { readonly cache?: CacheSource }).cache;
    if (cacheSource) {
      (this as { cache: Cache | null }).cache = Toshihiko.createCache(cacheSource);
    }
  }

  /**
   * Creates a Cache from an existing Cache instance or module-style options.
   * @zh 从现有 Cache 实例或模块式选项创建 Cache。
   * @ja 既存の Cache インスタンス、またはモジュール形式のオプションから Cache を作成します。
   * @param source - Cache instance or `{ module, options }` configuration.
   * @zh source - Cache 实例或 `{ module, options }` 配置。
   * @ja source - Cache インスタンス、または `{ module, options }` 設定です。
   * @returns The existing or newly created Cache, or `null` when the source is
   * not a recognized Cache configuration.
   * @zh 现有或新建的 Cache，或 `null`，表示 source 不是可识别的 Cache 配置。
   * @ja 既存または新しく作成した Cache です。source が認識できる Cache 設定ではない場合は `null` です。
   */
  static createCache(source: CacheSource): Cache | null {
    return createCache(source);
  }

  /**
   * The database name reported by the selected Adapter.
   * @zh 所选 Adapter 报告的数据库名。
   * @ja 選択された Adapter が報告するデータベース名です。
   */
  get database(): string {
    return getAdapterInstance(this).getDBName();
  }

  /**
   * Executes a raw Adapter operation without creating a Model or Query.
   *
   * The accepted arguments and resolved value come from the selected Adapter's
   * execute specification.
   * @zh 不创建 Model 或 Query，直接执行 Adapter 原始操作。
   *
   * 接受的参数和 Promise 结果由所选 Adapter 的 execute 规格决定。
   * @ja Model や Query を作成せずに、Adapter の生の操作を実行します。
   *
   * 受け付ける引数と解決後の値は、選択された Adapter の execute 仕様から決まります。
   * @param arguments_ - Adapter-defined execute arguments.
   * @zh arguments_ - 由 Adapter 定义的 execute 参数。
   * @ja arguments_ - Adapter が定義する execute 引数です。
   * @returns The Adapter-defined execution result.
   * @zh 由 Adapter 定义的执行结果。
   * @ja Adapter が定義する実行結果です。
   */
  async execute(
    ...arguments_: AdapterExecuteArguments<AdapterInstance>
  ): Promise<AdapterExecuteResult<AdapterInstance>> {
    const adapter = getAdapterInstance(this) as unknown as {
      execute(...values: AdapterExecuteArguments<AdapterInstance>): Promise<AdapterExecuteResult<AdapterInstance>>;
    };
    return await adapter.execute(...arguments_);
  }

  /**
   * Defines a typed Model for one table or collection.
   *
   * Field names and values are inferred from the schema array. Functions in
   * `options.methods` are copied onto the returned Model and receive a
   * contextually typed `this` containing both the Model API and the other
   * custom methods.
   * @zh 为一张表或一个集合定义带类型的 Model。
   *
   * 字段名和值从 schema 数组推断。以下位置中的函数：
   * `options.methods` 会被复制到返回的 Model 上，并获得具有上下文类型的 `this`，其中同时包含 Model API 和其他自定义方法。
   * @ja 1 個のテーブルまたはコレクションに対する型付き Model を定義します。
   *
   * フィールド名と値は schema 配列から推論されます。`options.methods` の関数は返される Model へコピーされ、Model API とほかのカスタムメソッドの両方を含む、contextual type が付いた `this` を受け取ります。
   * @param collectionName - Adapter-facing table or collection name.
   * @zh collectionName - 提供给 Adapter 的表名或集合名。
   * @ja collectionName - Adapter に渡すテーブル名またはコレクション名です。
   * @param schema - Field definitions used for runtime conversion and static
   * row inference.
   * @zh schema - 用于运行时转换和静态数据行推断的字段定义。
   * @ja schema - 実行時の変換と静的なデータ行推論に使用するフィールド定義です。
   * @param options - Model options, including Cache configuration and custom
   * Model methods.
   * @zh options - Model 选项，包括 Cache 配置和自定义 Model 方法。
   * @ja options - Cache 設定とカスタム Model メソッドを含む Model オプションです。
   * @returns A Model extended with the inferred custom methods.
   * @zh 带有推断后自定义方法的 Model。
   * @ja 推論されたカスタムメソッドで拡張された Model です。
   * @example
   * ```ts
   * const User = database.define('users', [
   *   { name: 'id', type: Type.Integer, primaryKey: true },
   *   { name: 'email', type: Type.String },
   * ], {
   *   methods: {
   *     findByEmail(email: string) {
   *       return this.where({ email }).findOne();
   *     },
   *   },
   * });
   * ```
   */
  define<
    const Name extends string,
    const Schema extends SchemaDefinition,
    const Methods extends object = object,
  >(
    collectionName: Name,
    schema: Schema,
    options: ModelDefinitionOptions<
      Name,
      Schema,
      AdapterInstance,
      Methods
    > = {},
    ...validation: IsValidDefinition<Name, Schema, AdapterInstance> extends true
      ? readonly []
      : readonly [schemaTypeError: never]
  ): Model<Name, Schema, AdapterInstance> & Methods {
    void validation;
    const model = new Model<Name, Schema, AdapterInstance>(
      collectionName,
      this,
      schema,
      options,
    );
    if (options?.methods) {
      Object.assign(model, options.methods);
    }
    return model as Model<Name, Schema, AdapterInstance> & Methods;
  }
}

export function getAdapterInstance<AdapterInstance extends AdapterLike>(
  toshihiko: Toshihiko<AdapterInstance>,
): AdapterInstance {
  return adapterInstances.get(toshihiko) as AdapterInstance;
}

function attachAdapterCompatibility<
  AdapterInstance extends AdapterLike,
  Options extends object,
>(
  parent: Toshihiko<AdapterInstance, Options>,
  adapter: AdapterInstance,
): void {
  if (!Object.prototype.hasOwnProperty.call(adapter, 'parent')) {
    try {
      Object.defineProperty(adapter, 'parent', {
        configurable: false,
        enumerable: false,
        value: parent,
        writable: false,
      });
    } catch {
      // Some directly injected Adapter instances may be non-extensible.
    }
  }

  if ('mysql' in adapter) {
    Object.defineProperty(parent, 'pool', {
      configurable: true,
      enumerable: false,
      get: () => adapter.mysql,
    });
  }
}

export function loadAdapter<
  Options extends object = ToshihikoOptions,
  AdapterInstance extends AdapterLike = Adapter,
>(name: string): AdapterConstructor<Options, AdapterInstance> {
  const packageName = name.startsWith('.') || name.startsWith('/') || name.startsWith('@')
    ? name
    : `@toshihiko/${name}-adapter`;
  let loader = require;
  let resolved: string;
  try {
    resolved = loader.resolve(packageName);
  } catch {
    loader = createRequire(join(process.cwd(), 'package.json'));
    resolved = loader.resolve(packageName);
  }
  const loaded = loader(resolved) as
    | AdapterConstructor<Options, AdapterInstance>
    | {
        readonly Adapter?: AdapterConstructor<Options, AdapterInstance>;
        readonly default?: AdapterConstructor<Options, AdapterInstance>;
      };
  if (typeof loaded === 'function') return loaded;
  return loaded.default ?? loaded.Adapter!;
}
