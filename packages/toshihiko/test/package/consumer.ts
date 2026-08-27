import {
  Toshihiko,
  Type,
  type Adapter,
  type AdapterData,
  type AdapterFindOptions,
  type AdapterFindResult,
  type AdapterQuery,
  type AdapterRow,
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
const inserted: Promise<typeof user> = user.insert();
const updated: Promise<typeof user> = inserted.then((row) => row.update());

void user;
void id;
void name;
void json;
void jsonId;
void inserted;
void updated;

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

  async insert(
    model: unknown,
    connection: unknown,
    data: readonly AdapterData[],
  ): Promise<AdapterRow | null> {
    void model;
    void connection;
    void data;
    return {};
  }

  async update(
    model: unknown,
    connection: unknown,
    primaryKey: Readonly<Record<string, unknown>>,
    data: readonly AdapterData[],
  ): Promise<void> {
    void model;
    void connection;
    void primaryKey;
    void data;
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
