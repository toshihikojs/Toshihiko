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
import type { Query } from './query';
import {
  createCache,
  type Cache,
  type CacheSource,
} from './contracts/cache';

export type ToshihikoOptions = object;

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
    Query<Name, Schema, AdapterInstance>,
    AdapterQueryType<AdapterInstance>
  >
  | IsAssignableWhenUsed<
    Query<Name, Schema, AdapterInstance>,
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
    Query<Name, Schema, AdapterInstance>,
    AdapterDeleteQueryType<AdapterInstance>
  >
  | IsAssignableWhenUsed<
    Query<Name, Schema, AdapterInstance>,
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

export class Toshihiko<
  AdapterInstance extends AdapterLike = Adapter,
  Options extends object = ToshihikoOptions,
> extends EventEmitter2 {
  readonly adapter: AdapterInstance;
  declare readonly cache: Cache | null | undefined;
  readonly dialect: string | null;
  readonly options: Options;
  declare readonly pool: AdapterInstance extends { readonly mysql: infer Pool }
    ? Pool
    : undefined;

  constructor(
    adapter: AdapterSource<Options, AdapterInstance>,
    ...[options]: {} extends Options
      ? readonly [options?: Options]
      : readonly [options: Options]
  ) {
    super();
    this.options = (options ?? {}) as Options;

    if (typeof adapter === 'string') {
      const Constructor = loadAdapter<Options, AdapterInstance>(adapter);
      this.adapter = new Constructor(this, this.options);
      this.dialect = adapter;
    } else if (typeof adapter === 'function') {
      const Constructor = adapter as AdapterConstructor<Options, AdapterInstance>;
      this.adapter = new Constructor(this, this.options);
      this.dialect = Constructor.name || null;
    } else {
      this.adapter = adapter;
      this.dialect = adapter.constructor.name || null;
    }

    attachAdapterCompatibility(this, this.adapter);

    const cacheSource = (this.options as { readonly cache?: CacheSource }).cache;
    if (cacheSource) {
      (this as { cache: Cache | null }).cache = Toshihiko.createCache(cacheSource);
    }
  }

  static createCache(source: unknown): Cache | null {
    return createCache(source);
  }

  get database(): string {
    return this.adapter.getDBName();
  }

  getAdapter(): AdapterInstance {
    return this.adapter;
  }

  async execute(
    ...arguments_: AdapterExecuteArguments<AdapterInstance>
  ): Promise<AdapterExecuteResult<AdapterInstance>> {
    const adapter = this.getAdapter() as unknown as {
      execute(...values: AdapterExecuteArguments<AdapterInstance>): Promise<AdapterExecuteResult<AdapterInstance>>;
    };
    return await adapter.execute(...arguments_);
  }

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
    ..._validation: IsValidDefinition<Name, Schema, AdapterInstance> extends true
      ? readonly []
      : readonly [schemaTypeError: never]
  ): Model<Name, Schema, AdapterInstance> & Methods {
    void _validation;
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
