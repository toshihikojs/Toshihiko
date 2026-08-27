import {
  Adapter,
  extend,
  type AdapterData,
} from '../../src';

interface TypedOptions {
  readonly database: string;
}

const adapter = new Adapter<TypedOptions>({ database: 'typed' });
const database: string = adapter.options.database;
const data: AdapterData<{ readonly name: string }, string> = {
  field: { name: 'id' },
  value: '1',
};

void database;
void data;

// @ts-expect-error Adapter options retain their declared shape.
new Adapter<TypedOptions>({ database: 1 });

// @ts-expect-error Required Adapter options cannot be omitted.
new Adapter<TypedOptions>();

const invalidData: AdapterData<{ readonly name: string }, string> = {
  field: { name: 'id' },
  // @ts-expect-error Adapter data retains its declared value type.
  value: 1,
};

void invalidData;

const merged = extend(
  { nested: { fromDefault: true }, port: 3306 },
  { nested: { fromOptions: 'yes' }, port: '3307' },
);
const mergedPort: string = merged.port;
const mergedDefault: boolean = merged.nested.fromDefault;
const mergedOption: string = merged.nested.fromOptions;
void mergedPort;
void mergedDefault;
void mergedOption;

interface NamedDefaults {
  nested: {
    fromDefault: boolean;
  };
}

interface NamedOptions {
  nested: {
    fromOptions: string;
  };
}

const namedDefaults: NamedDefaults = { nested: { fromDefault: true } };
const namedOptions: NamedOptions = { nested: { fromOptions: 'yes' } };
const namedMerged = extend(namedDefaults, namedOptions);
const namedDefault: boolean = namedMerged.nested.fromDefault;
const namedOption: string = namedMerged.nested.fromOptions;
void namedDefault;
void namedOption;

interface OptionalNamedOptions {
  nested?: {
    fromOptions: string;
  };
}

const optionalNamedOptions: OptionalNamedOptions = {};
const optionalMerged = extend(namedDefaults, optionalNamedOptions);
const guaranteedNested: { fromDefault: boolean } | {
  fromDefault: boolean;
  fromOptions: string;
} = optionalMerged.nested;
void guaranteedNested;

class OptionsWithMethod {
  readonly database = 'typed';

  getDatabase(): string {
    return this.database;
  }
}

const optionsWithMethod = new OptionsWithMethod();
const adapterWithMethod = new Adapter<OptionsWithMethod>(optionsWithMethod);
const methodResult: string = adapterWithMethod.options.getDatabase();
void methodResult;
