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
  AdapterField,
  AdapterLike,
  AdapterModel,
  AdapterQueryType,
  AdapterSource,
  AdapterUpdateConnection,
  AdapterUpdateField,
  AdapterUpdateModel,
  AdapterUpdateValue,
  AdapterValue,
} from './contracts/adapter';
import type { Query } from './query';
import type { Yukari } from './yukari';

export type ToshihikoOptions = object;

type IsAdapterCompatible<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike,
> = IsAssignableWhenUsed<
  Model<Name, Schema, AdapterInstance>,
  AdapterModel<AdapterInstance>
> extends true
  ? IsAssignableWhenUsed<
    Query<Name, Schema, AdapterInstance>,
    AdapterQueryType<AdapterInstance>
  > extends true
    ? IsAssignableWhenUsed<
      Field<Schema[number]>,
      AdapterField<AdapterInstance>
    > extends true
      ? IsAssignableWhenUsed<
        FieldDefinitionValue<Schema[number]>,
        AdapterValue<AdapterInstance>
      > extends true
        ? IsAssignableWhenUsed<
          Model<Name, Schema, AdapterInstance>,
          AdapterUpdateModel<AdapterInstance>
        > extends true
          ? IsAssignableWhenUsed<
            AdapterConnection<AdapterInstance>,
            AdapterUpdateConnection<AdapterInstance>
          > extends true
            ? IsAssignableWhenUsed<
              Field<Schema[number]>,
              AdapterUpdateField<AdapterInstance>
            > extends true
              ? IsAssignableWhenUsed<
                FieldDefinitionValue<Schema[number]>,
                AdapterUpdateValue<AdapterInstance>
              >
              : false
            : false
          : false
        : false
      : false
    : false
  : false;

type IsAssignableWhenUsed<Actual, Expected> = [Expected] extends [never]
  ? true
  : Actual extends Expected ? true : false;

type ReservedYukariFieldName =
  | Extract<keyof Yukari<string, SchemaDefinition, Adapter>, string>
  | 'constructor'
  | `$${string}`;

type HasReservedFieldName<Schema extends SchemaDefinition> =
  Extract<Schema[number]['name'], ReservedYukariFieldName> extends never
    ? false
    : true;

type IsValidDefinition<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike,
> = NoInfer<Schema> extends ValidatedSchema<NoInfer<Schema>>
  ? HasReservedFieldName<NoInfer<Schema>> extends false
    ? IsAdapterCompatible<Name, NoInfer<Schema>, AdapterInstance>
    : false
  : false;

export class Toshihiko<
  AdapterInstance extends AdapterLike = Adapter,
  Options extends object = ToshihikoOptions,
> {
  readonly adapter: AdapterInstance | null;
  readonly dialect: string | null;
  readonly options: Options;

  constructor(
    adapter: AdapterSource<Options, AdapterInstance>,
    ...[options]: {} extends Options
      ? readonly [options?: Options]
      : readonly [options: Options]
  ) {
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
