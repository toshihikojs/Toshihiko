import {
  Toshihiko,
  Type,
  type FieldType,
  type InferModelPrimaryKey,
  type InferModelRow,
} from '../../src';

const Industry = {
  name: 'Industry',
  parse(value: string) {
    const [big = '', small = ''] = value.split(',');
    return { big, small };
  },
  restore(value: { big: string; small: string }) {
    return `${value.big},${value.small}`;
  },
} satisfies FieldType<{ big: string; small: string }, string>;

const toshihiko = new Toshihiko('mysql', {
  database: 'toshihiko',
});

const User = toshihiko.define('user', [
  {
    name: 'id',
    column: 'user_id',
    type: Type.Integer,
    primaryKey: true,
    autoIncrement: true,
  },
  {
    name: 'username',
    type: Type.String,
  },
  {
    name: 'birthday',
    type: Type.Datetime,
    allowNull: true,
  },
  {
    name: 'industry',
    type: Industry,
  },
  {
    name: 'nickname',
  },
] as const);

const Validated = toshihiko.define('validated', [
  {
    name: 'score',
    type: Type.Integer,
    default: 0,
    async validators(value: number) {
      if (value < 0) {
        return 'score must not be negative';
      }
    },
  },
] as const);

type UserRow = InferModelRow<typeof User>;
type UserPrimaryKey = InferModelPrimaryKey<typeof User>;

const user: UserRow = {
  id: 1,
  username: 'Alice',
  birthday: null,
  industry: { big: 'internet', small: 'financial' },
  nickname: 'ali',
};

const primaryKey: UserPrimaryKey = 'id';
const idColumn: 'user_id' = User.nameToColumn.id;
const nicknameColumn: 'nickname' = User.nameToColumn.nickname;

void user;
void primaryKey;
void idColumn;
void nicknameColumn;
void Validated;

const invalidUser: UserRow = {
  id: 1,
  username: 'Alice',
  birthday: null,
  industry: { big: 'internet', small: 'financial' },
  nickname: 'ali',
  // @ts-expect-error Schema-derived rows reject unknown fields.
  displayName: 'Alice',
};

void invalidUser;

// @ts-expect-error Custom FieldType values are preserved by define().
const invalidIndustry: UserRow['industry'] = 'internet,financial';

void invalidIndustry;

// @ts-expect-error Only fields marked as primary keys are inferred.
const invalidPrimaryKey: UserPrimaryKey = 'username';

void invalidPrimaryKey;

// @ts-expect-error Defaults must use the FieldType value type.
toshihiko.define('invalid-default', [{ name: 'score', type: Type.Integer, default: 'zero' }] as const);

const syncValidator = (value: number): string | void => {
  if (value < 0) {
    return 'score must not be negative';
  }
};

// @ts-expect-error v2 validators must return Promise objects.
toshihiko.define('invalid-sync-validator', [{ name: 'score', type: Type.Integer, validators: syncValidator }] as const);

const callbackValidator = (
  value: number,
  callback: (error?: Error) => void,
): void => {
  callback(value < 0 ? new Error('score must not be negative') : undefined);
};

// @ts-expect-error v2 does not support callback validators.
toshihiko.define('invalid-callback-validator', [{ name: 'score', type: Type.Integer, validators: callbackValidator }] as const);
