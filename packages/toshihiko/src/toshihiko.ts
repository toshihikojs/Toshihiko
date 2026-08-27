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
  readonly dialect: string | null;
  readonly options: Options;

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
      return;
    }

    if (typeof adapter === 'function') {
      const Constructor = adapter as AdapterConstructor<Options, AdapterInstance>;
      this.adapter = new Constructor(this.options);
      this.dialect = Constructor.name || null;
      return;
    }

    this.adapter = adapter;
    this.dialect = adapter.constructor.name || null;
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
