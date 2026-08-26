import { Model, type ModelOptions } from './contracts/model';
import type { SchemaDefinition } from './contracts/field';
import type {
  Adapter,
  AdapterConstructor,
  AdapterSource,
} from './contracts/adapter';

export interface ToshihikoOptions {
  readonly [key: string]: unknown;
}

export class Toshihiko<
  AdapterInstance extends Adapter = Adapter,
  Options extends ToshihikoOptions = ToshihikoOptions,
> {
  readonly adapter: AdapterInstance | null;
  readonly dialect: string | null;
  readonly options: Options;

  constructor(
    adapter: AdapterSource<Options, AdapterInstance>,
    options: Options = {} as Options,
  ) {
    this.options = options;

    if (typeof adapter === 'string') {
      this.adapter = null;
      this.dialect = adapter;
      return;
    }

    if (typeof adapter === 'function') {
      if (adapter.length > 1) {
        throw new TypeError(
          'legacy callback Adapter constructors are not supported in Toshihiko v2.',
        );
      }

      const Constructor = adapter as AdapterConstructor<Options, AdapterInstance>;
      this.adapter = new Constructor(options);
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
  ): Model<Name, Schema> {
    return new Model<Name, Schema>(collectionName, this, schema, options);
  }
}
