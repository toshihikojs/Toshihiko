import {
  Toshihiko,
  Type,
  type Adapter,
  type AdapterData,
  type AdapterFindOptions,
  type AdapterFindResult,
  type AdapterQuery,
  type AdapterRow,
  type Cache,
  type DataRow,
} from '../..';

const toshihiko = new Toshihiko('mysql');
const User = toshihiko.define('user', [
  { name: 'id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
], {
  methods: {
    findByName(name: string) {
      return this.where({ name }).findOne();
    },
    findByNameTwice(name: string) {
      return Promise.all([
        this.findByName(name),
        this.findByName(name),
      ]);
    },
  },
});

const user = User.build({ id: 1, name: 'Alice' });
const id: number = user.id;
const name: string = user.name;
const json = user.toJSON();
const jsonId: number | undefined = json.id;
const inserted: Promise<typeof user> = user.insert();
const updated: Promise<typeof user> = inserted.then((row) => row.update());
const saved: Promise<typeof user> = user.save();
const deleted: Promise<true> = updated.then((row) => row.delete());
const counted: Promise<number> = User.where({ id: { $gte: 1 } }).count();
const foundByName = User.findByName('Alice');
const foundByNameTwice = User.findByNameTwice('Alice');

foundByName.then((row) => {
  const foundName: string | undefined = row?.name;
  void foundName;
});

foundByNameTwice.then((rows) => {
  const foundName: string | undefined = rows[0]?.name;
  void foundName;
});

void user;
void id;
void name;
void json;
void jsonId;
void inserted;
void updated;
void saved;
void deleted;
void counted;
void foundByName;
void foundByNameTwice;

const cache: Cache = {
  async deleteData() {},
  async deleteKeys() {},
  async getData<Value extends object>(): Promise<(Value | null)[]> {
    return [{ id: 1 } as Value];
  },
  async setData() {},
};
const CachedUser = toshihiko.define('cached_user', [
  { name: 'id', type: Type.Integer, primaryKey: true },
], { cache });
const cachedUser = CachedUser.findById(1);

void cachedUser;

class ConsumerAdapter implements Adapter {
  constructor(
    readonly parent: object,
    readonly options: { readonly database: string },
  ) {}

  async find(
    query: AdapterQuery,
    options?: AdapterFindOptions,
  ): Promise<AdapterFindResult> {
    void query;
    void options;
    return [];
  }

  async count(query: AdapterQuery): Promise<number> {
    void query;
    return 0;
  }

  async insert(
    model: object,
    connection: object | null,
    data: readonly AdapterData[],
  ): Promise<AdapterRow | null> {
    void model;
    void connection;
    void data;
    return {};
  }

  async update(
    model: object,
    connection: object | null,
    primaryKey: DataRow,
    data: readonly AdapterData[],
  ): Promise<void> {
    void model;
    void connection;
    void primaryKey;
    void data;
  }

  async deleteByQuery(query: AdapterQuery): Promise<void> {
    void query;
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
