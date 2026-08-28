import { EventEmitter2 } from 'eventemitter2';
import {
  Model,
  type ModelOptions,
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
  readonly adapter: AdapterInstance | null;
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
      this.adapter = null;
      this.dialect = adapter;
    } else if (typeof adapter === 'function') {
      const Constructor = adapter as AdapterConstructor<Options, AdapterInstance>;
      this.adapter = new Constructor(this.options);
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
    return this.adapter?.getDBName() ?? '';
  }

  getAdapter(): AdapterInstance {
    if (this.adapter === null) {
      throw new Error(
        `Adapter "${this.dialect ?? 'unknown'}" is not available in the v2 core. `
        + 'Pass an Adapter constructor or instance instead.',
      );
    }

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
  >(
    collectionName: Name,
    schema: Schema,
    options: ModelOptions = {},
    ..._validation: IsValidDefinition<Name, Schema, AdapterInstance> extends true
      ? readonly []
      : readonly [schemaTypeError: never]
  ): Model<Name, Schema, AdapterInstance> {
    void _validation;
    return new Model<Name, Schema, AdapterInstance>(
      collectionName,
      this,
      schema,
      options,
    );
  }
}

function attachAdapterCompatibility(
  parent: Toshihiko<AdapterLike, object>,
  adapter: AdapterLike | null,
): void {
  if (adapter === null) return;

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
      get: () => (adapter as AdapterLike & { readonly mysql: unknown }).mysql,
    });
  }
}
