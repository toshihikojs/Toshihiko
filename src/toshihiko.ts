import { Model, type ModelOptions } from './contracts/model';
import type { SchemaDefinition, ValidatedSchema } from './contracts/field';

export interface ToshihikoOptions {
  readonly [key: string]: unknown;
}

export class Toshihiko<
  Dialect extends string = string,
  Options extends ToshihikoOptions = ToshihikoOptions,
> {
  readonly dialect: Dialect;
  readonly options: Options;

  constructor(dialect: Dialect, options: Options = {} as Options) {
    this.dialect = dialect;
    this.options = options;
  }

  define<
    const Name extends string,
    const Schema extends SchemaDefinition,
  >(
    collectionName: Name,
    schema: Schema & ValidatedSchema<Schema>,
    options: ModelOptions = {},
  ): Model<Name, Schema> {
    return new Model<Name, Schema>(collectionName, this, schema, options);
  }
}
