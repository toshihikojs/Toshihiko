import {
  Toshihiko,
  Type,
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
