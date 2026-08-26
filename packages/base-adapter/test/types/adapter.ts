import {
  Adapter,
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

const invalidData: AdapterData<{ readonly name: string }, string> = {
  field: { name: 'id' },
  // @ts-expect-error Adapter data retains its declared value type.
  value: 1,
};

void invalidData;
