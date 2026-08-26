import {
  Adapter,
  AdapterData,
  BaseType,
  Escaper,
  FieldDefinition,
  Model,
  Query,
  Toshihiko,
  Type,
  Yukari,
} from '../..';

interface UserRow {
  id: number;
  name: string;
}

const schema: FieldDefinition[] = [
  { name: 'id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String, allowNull: false },
];

const toshihiko = new Toshihiko('base');
const User: Model<UserRow> = toshihiko.define<UserRow>('user', schema);
const query: Query<UserRow> = User
  .where({ id: { '<=': 10 } })
  .index('PRIMARY')
  .fields(['id', 'name'])
  .orderBy('id desc');

const entity: Yukari<UserRow> = User.build({ id: 1, name: 'Alice' });
const found = User.findById(1);
const deleted = query.delete();

found.then(row => {
  if(row) row.id;
});
deleted.then(result => result);
entity.save().then(row => row && row.name);

const customType: BaseType<number, string> = {
  name: 'custom',
  parse: value => Number(value),
  restore: value => String(value),
};
customType.restore(1);

const baseAdapter = new Adapter.base(toshihiko, {});
baseAdapter.getDBName();

const adapterData: AdapterData[] = User.schema.map(field => ({ field, value: null }));
adapterData.forEach(item => item.field.name);

Escaper.escape("Toshihiko's");
Escaper.escapeLike('100%');

// Query, Model and Yukari are type-only exports. Their constructors are not
// exported by the CommonJS entry point.
// @ts-expect-error Query has no public runtime constructor export.
new Query(User);

// @ts-expect-error index names are strings at runtime.
User.index(1);

// @ts-expect-error delete accepts only an optional callback.
User.delete({ id: 1 });
