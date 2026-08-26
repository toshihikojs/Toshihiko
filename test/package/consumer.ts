import {
  Toshihiko,
  Type,
} from '../..';

const toshihiko = new Toshihiko('mysql');
const User = toshihiko.define('user', [
  { name: 'id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
]);

const user: typeof User.row = { id: 1, name: 'Alice' };

void user;
