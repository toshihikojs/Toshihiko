import {
  Toshihiko,
  Type,
  type InferModelRow,
} from '../..';

const toshihiko = new Toshihiko('mysql');
const User = toshihiko.define('user', [
  { name: 'id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
]);

type UserRow = InferModelRow<typeof User>;

const user: UserRow = { id: 1, name: 'Alice' };

void user;
