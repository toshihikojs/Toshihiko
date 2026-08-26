import {
  Toshihiko,
  Type,
  type Adapter,
  type AdapterFindOptions,
  type AdapterFindResult,
  type AdapterQuery,
} from '../..';

const toshihiko = new Toshihiko('mysql');
const User = toshihiko.define('user', [
  { name: 'id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
]);

const user = User.build({ id: 1, name: 'Alice' });
const id: number = user.id;
const name: string = user.name;
const json = user.toJSON();
const jsonId: number | undefined = json.id;

void user;
void id;
void name;
void json;
void jsonId;

class ConsumerAdapter implements Adapter {
  constructor(readonly options: { readonly database: string }) {}

  async find(
    query: AdapterQuery,
    options?: AdapterFindOptions,
  ): Promise<AdapterFindResult> {
    void query;
    void options;
    return [];
  }

  getDBName(): string {
    return this.options.database;
  }
}

const connected = new Toshihiko(ConsumerAdapter, { database: 'consumer' });
const ConnectedUser = connected.define('user', [
  { name: 'id', type: Type.Integer, primaryKey: true },
]);
const found = ConnectedUser.findById(1);

void found;
