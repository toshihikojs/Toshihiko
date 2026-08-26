import {
  Toshihiko,
  Type,
  type Adapter,
  type AdapterFindOptions,
  type AdapterFindResult,
  type AdapterQuery,
  type FieldDefinition,
  type FieldType,
  type InferModelPrimaryKey,
  type InferModelRow,
} from '../../src';

const Industry = {
  name: 'Industry',
  needQuotes: false,
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
type UserRow = InferModelRow<typeof User>;

const user = User.build({
  id: 1,
  username: 'Alice',
  birthday: null,
  industry: { big: 'internet', small: 'financial' },
  nickname: 'ali',
});

const inferredRow: UserRow = {
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
void inferredRow;
void primaryKey;
void idColumn;
void nicknameColumn;
void Validated;

// @ts-expect-error Custom FieldType values are preserved by define().
User.build({ industry: 'internet,financial' });

const partialUser = User.build({
  id: 2,
  username: 'Bob',
  industry: { big: 'internet', small: 'social' },
  nickname: 'bobby',
});
const optionalBirthday: Date | null | undefined = partialUser.birthday;
const validation: Promise<void> = Validated.build({ score: 1 }).validateAll();
const serializedBirthday: string | null | undefined = user.toJSON().birthday;

void optionalBirthday;
void validation;
void serializedBirthday;

class TestAdapter implements Adapter {
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

const connected = new Toshihiko(TestAdapter, { database: 'typed' });
const ConnectedUser = connected.define('connected-user', [
  { name: 'id', type: Type.Integer, primaryKey: true },
  { name: 'name', type: Type.String },
]);
const foundUsers = ConnectedUser
  .where({ id: { $gte: 1 }, name: { $like: 'A%' } })
  .orderBy({ id: 'desc' })
  .limit(10)
  .find();
const foundUser = ConnectedUser.findById(1);
const foundJson = ConnectedUser.findById(1, true);

foundUsers.then((rows) => {
  const foundId: number | undefined = rows[0]?.id;
  void foundId;
});
foundUser.then((row) => {
  const foundName: string | undefined = row?.name;
  void foundName;
});
foundJson.then((row) => {
  const foundName: string | undefined = row?.name;
  void foundName;
});

// @ts-expect-error Query conditions reject unknown logical field names.
ConnectedUser.where({ missing: 1 });

// @ts-expect-error findById() preserves the primary-key FieldType.
ConnectedUser.findById('1');

const Membership = connected.define('membership', [
  { name: 'userId', type: Type.Integer, primaryKey: true },
  { name: 'groupId', type: Type.Integer, primaryKey: true },
]);
Membership.findById({ userId: 1, groupId: 2 });

// @ts-expect-error Composite primary keys require the complete key object.
Membership.findById({ userId: 1 });

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
