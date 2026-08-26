import {
  Toshihiko,
  Type,
  type FieldDefinition,
  type FieldType,
  type InferModelPrimaryKey,
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
]);

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
]);

type UserPrimaryKey = InferModelPrimaryKey<typeof User>;

const user = User.build({
  id: 1,
  username: 'Alice',
  birthday: null,
  industry: { big: 'internet', small: 'financial' },
  nickname: 'ali',
});

const primaryKey: UserPrimaryKey = 'id';
const idColumn: 'user_id' = User.nameToColumn.id;
const nicknameColumn: 'nickname' = User.nameToColumn.nickname;

void user;
void primaryKey;
void idColumn;
void nicknameColumn;
void Validated;

const invalidUser: typeof User.row = {
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
const invalidIndustry: typeof User.row.industry = 'internet,financial';

void invalidIndustry;

const partialUser = User.build({
  id: 2,
  username: 'Bob',
  industry: { big: 'internet', small: 'social' },
  nickname: 'bobby',
});
const optionalBirthday: Date | null | undefined = partialUser.birthday;
const validation: Promise<void> = Validated.build({ score: 1 }).validateAll();

void optionalBirthday;
void validation;

// @ts-expect-error build() preserves FieldType value types.
User.build({ id: '1' });

// @ts-expect-error build() rejects unknown logical field names.
User.build({ id: 1, missing: true });

// @ts-expect-error Only fields marked as primary keys are inferred.
const invalidPrimaryKey: UserPrimaryKey = 'username';

void invalidPrimaryKey;

const invalidDefault: FieldDefinition<'score', typeof Type.Integer> = {
  name: 'score',
  type: Type.Integer,
  // @ts-expect-error Defaults must use the FieldType value type.
  default: 'zero',
};

void invalidDefault;

const syncValidator = (value: number): string | void => {
  if (value < 0) {
    return 'score must not be negative';
  }
};

// @ts-expect-error v2 validators must return Promise objects.
toshihiko.define('invalid-sync-validator', [{ name: 'score', type: Type.Integer, validators: syncValidator }]);

const callbackValidator = (
  value: number,
  callback: (error?: Error) => void,
): void => {
  callback(value < 0 ? new Error('score must not be negative') : undefined);
};

// @ts-expect-error v2 does not support callback validators.
toshihiko.define('invalid-callback-validator', [{ name: 'score', type: Type.Integer, validators: callbackValidator }]);
