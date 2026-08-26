import {
  Adapter,
  type AdapterData,
  type AdapterQuery,
  type AdapterRow,
  type AdapterTypeMap,
} from '../../src';

interface TypedMap extends AdapterTypeMap {
  readonly connection: { readonly id: number };
  readonly executeArguments: readonly [statement: string];
  readonly executeResult: readonly AdapterRow[];
  readonly field: { readonly name: string };
  readonly fieldValue: string;
  readonly findResult: readonly AdapterRow[];
  readonly insertResult: AdapterRow;
  readonly mutationResult: { readonly affectedRows: number };
  readonly options: { readonly database: string };
  readonly query: AdapterQuery<{ readonly name: string }>;
}

const adapter = new Adapter<TypedMap>({ database: 'typed' });
const database: string = adapter.options.database;
const data: AdapterData<TypedMap['field'], TypedMap['fieldValue']> = {
  field: { name: 'id' },
  value: '1',
};

void database;
void data;

// @ts-expect-error Adapter options retain their declared shape.
new Adapter<TypedMap>({ database: 1 });

const invalidData: AdapterData<TypedMap['field'], TypedMap['fieldValue']> = {
  field: { name: 'id' },
  // @ts-expect-error Adapter data retains its declared value type.
  value: 1,
};

void invalidData;
