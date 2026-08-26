import {
  Adapter,
  type AdapterFindOptions,
  type AdapterQuery,
  type AdapterRow,
  type AdapterTypeMap,
} from '../..';
import { Toshihiko, Type } from 'toshihiko';

interface TestModel {
  readonly name: string;
}

interface TestAdapterTypes extends AdapterTypeMap {
  readonly connection: { readonly transactionId: number };
  readonly executeArguments: readonly [sql: string, parameters?: readonly unknown[]];
  readonly executeResult: readonly AdapterRow[];
  readonly field: { readonly name: string };
  readonly fieldValue: unknown;
  readonly findResult: readonly AdapterRow[] | AdapterRow | null;
  readonly insertResult: AdapterRow;
  readonly mutationResult: { readonly affectedRows: number };
  readonly options: { readonly database: string };
  readonly query: AdapterQuery<TestModel>;
}

class TestAdapter extends Adapter<TestAdapterTypes> {
  override async find(
    query: TestAdapterTypes['query'],
    options?: AdapterFindOptions,
  ): Promise<TestAdapterTypes['findResult']> {
    void query;
    return options?.single ? null : [];
  }

  override getDBName(): string {
    return this.options.database;
  }
}

const toshihiko = new Toshihiko(TestAdapter, { database: 'typed' });
const User = toshihiko.define('user', [
  { name: 'id', type: Type.Integer, primaryKey: true },
]);
const users = User.find();

users.then((rows) => {
  const id: number | undefined = rows[0]?.id;
  void id;
});
