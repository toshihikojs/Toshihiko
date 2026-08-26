import {
  Adapter,
  type AdapterFindOptions,
  type AdapterQuery,
  type AdapterRow,
} from '../..';
import { Toshihiko, Type } from 'toshihiko';

interface TestModel {
  readonly name: string;
}

interface TestAdapterOptions {
  readonly database: string;
}

class TestAdapter extends Adapter<TestAdapterOptions> {
  override async find(
    query: AdapterQuery<TestModel>,
    options?: AdapterFindOptions,
  ): Promise<readonly AdapterRow[] | AdapterRow | null> {
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
