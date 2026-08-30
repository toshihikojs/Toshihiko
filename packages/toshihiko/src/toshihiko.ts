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

/** Default option constraint used when an Adapter does not declare its own. */
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
 *
 * @category Application API
 */
export class Toshihiko<
  AdapterInstance extends AdapterLike = Adapter,
  Options extends object = ToshihikoOptions,
> extends EventEmitter2 {
  /** Cache created from `options.cache`, when configured. */
  declare readonly cache: Cache | null | undefined;
  /** Adapter name or constructor name used for this instance. */
  readonly dialect: string | null;
  /** Adapter-specific options supplied to the constructor. */
  readonly options: Options;
  /** MySQL connection pool when exposed by the selected Adapter. */
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
   *
   * @param source - Cache instance or `{ module, options }` configuration.
   * @returns The existing or newly created Cache, or `null` when the source is
   * not a recognized Cache configuration.
   */
  static createCache(source: CacheSource): Cache | null {
    return createCache(source);
  }

  /** The database name reported by the selected Adapter. */
  get database(): string {
    return getAdapterInstance(this).getDBName();
  }

  /**
   * Executes a raw Adapter operation without creating a Model or Query.
   *
   * The accepted arguments and resolved value come from the selected Adapter's
   * execute specification.
   *
   * @param arguments_ - Adapter-defined execute arguments.
   * @returns The Adapter-defined execution result.
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
   *
   * @param collectionName - Adapter-facing table or collection name.
   * @param schema - Field definitions used for runtime conversion and static
   * row inference.
   * @param options - Model options, including Cache configuration and custom
   * Model methods.
   * @returns A Model extended with the inferred custom methods.
   *
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
