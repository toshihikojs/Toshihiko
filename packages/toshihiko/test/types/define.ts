import {
  Toshihiko,
  Type,
  type Adapter,
  type AdapterModel,
  type AdapterData,
  type AdapterFindOptions,
  type AdapterFindResult,
  type AdapterQuery,
  type AdapterRow,
  type FieldDefinition,
  type FieldType,
  type InferModelPrimaryKey,
  type InferModelRow,
  type YukariFieldData,
  type ValidatedSchema,
} from '../../src';

const defaultAdapterModel: AdapterModel<Adapter> = {};
void defaultAdapterModel;

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
    validators: async (value: number) => {
      const typedValue: number = value;
      if (typedValue < 0) {
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
const builtConnectedUser = ConnectedUser.build({ id: 1, name: 'Alice' });
const insertedConnectedUser: Promise<typeof builtConnectedUser> = builtConnectedUser.insert({
  transaction: 1,
});

void insertedConnectedUser;

interface TypedConnection {
  readonly transaction: number;
}

interface TypedModel {
  readonly name: string;
}

class TypedConnectionAdapter implements Adapter<
  TypedModel,
  TypedConnection,
  unknown,
  unknown,
  AdapterQuery<TypedModel, TypedConnection>
> {
  constructor(readonly options: { readonly database: string }) {}

  async find(
    query: AdapterQuery<TypedModel, TypedConnection>,
  ): Promise<AdapterFindResult> {
    void query;
    return [];
  }

  async insert(
    model: TypedModel,
    connection: TypedConnection | null,
    data: readonly AdapterData[],
  ): Promise<AdapterRow> {
    void model;
    void connection;
    void data;
    return {};
  }

  async update(
    model: TypedModel,
    connection: TypedConnection | null,
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

const typedConnections = new Toshihiko(TypedConnectionAdapter, { database: 'typed' });
const TypedConnectionModel = typedConnections.define('typed-connections', [{ name: 'id' }]);
TypedConnectionModel.conn({ transaction: 1 });
TypedConnectionModel.build({ id: '1' }).insert({ transaction: 1 });
TypedConnectionModel.findOne().then((row) => row?.update({ transaction: 1 }));
const concreteAdapter: TypedConnectionAdapter = TypedConnectionModel.parent.getAdapter();
void concreteAdapter;

// @ts-expect-error Required Adapter constructor options cannot be omitted.
new Toshihiko(TypedConnectionAdapter);

// @ts-expect-error Query.conn() preserves the Adapter connection type.
TypedConnectionModel.conn({ transaction: '1' });

// @ts-expect-error Yukari.insert() preserves the Adapter connection type.
TypedConnectionModel.build({ id: '1' }).insert({ transaction: '1' });

TypedConnectionModel.findOne().then((row) => {
  // @ts-expect-error Yukari.update() preserves the Adapter connection type.
  row?.update({ transaction: '1' });
});

interface UnsupportedModel {
  readonly name: string;
  readonly requiredByAdapter: true;
}

class UnsupportedModelAdapter implements Adapter<UnsupportedModel> {
  async find(query: AdapterQuery<UnsupportedModel>): Promise<AdapterFindResult> {
    void query;
    return [];
  }

  async insert(
    model: UnsupportedModel,
    connection: unknown,
    data: readonly AdapterData[],
  ): Promise<AdapterRow> {
    void model;
    void connection;
    void data;
    return {};
  }

  async update(
    model: UnsupportedModel,
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
    return 'unsupported-model';
  }
}

const unsupportedModel = new Toshihiko(new UnsupportedModelAdapter());
// @ts-expect-error Core Models must satisfy the Model contract declared by the Adapter.
unsupportedModel.define('unsupported-model', [{ name: 'id' }]);

interface UnsupportedQuery extends AdapterQuery {
  readonly requiredByAdapter: true;
}

class UnsupportedQueryAdapter implements Adapter<
  unknown,
  unknown,
  unknown,
  unknown,
  UnsupportedQuery
> {
  async find(query: UnsupportedQuery): Promise<AdapterFindResult> {
    void query;
    return [];
  }

  async insert(): Promise<AdapterRow> {
    return {};
  }

  async update(): Promise<void> {}

  getDBName(): string {
    return 'unsupported-query';
  }
}

const unsupportedQuery = new Toshihiko(new UnsupportedQueryAdapter());
// @ts-expect-error Core Queries must satisfy the Query contract declared by the Adapter.
unsupportedQuery.define('unsupported-query', [{ name: 'id' }]);

interface UnsupportedField {
  readonly requiredByAdapter: true;
}

class UnsupportedFieldAdapter implements Adapter<unknown, unknown, UnsupportedField> {
  async find(query: AdapterQuery): Promise<AdapterFindResult> {
    void query;
    return [];
  }

  async insert(
    model: unknown,
    connection: unknown,
    data: readonly AdapterData<UnsupportedField>[],
  ): Promise<AdapterRow> {
    void model;
    void connection;
    void data;
    return {};
  }

  async update(
    model: unknown,
    connection: unknown,
    primaryKey: Readonly<Record<string, unknown>>,
    data: readonly AdapterData<UnsupportedField>[],
  ): Promise<void> {
    void model;
    void connection;
    void primaryKey;
    void data;
  }

  getDBName(): string {
    return 'unsupported-field';
  }
}

const unsupportedField = new Toshihiko(new UnsupportedFieldAdapter());
// @ts-expect-error Compiled Fields must satisfy the Field contract declared by the Adapter.
unsupportedField.define('unsupported-field', [{ name: 'id' }]);

class UnsupportedUpdateAdapter {
  async find(query: AdapterQuery): Promise<AdapterFindResult> {
    void query;
    return [];
  }

  async insert(
    model: unknown,
    connection: unknown,
    data: readonly AdapterData[],
  ): Promise<AdapterRow> {
    void model;
    void connection;
    void data;
    return {};
  }

  async update(
    model: { readonly requiredByUpdate: true },
    connection: { readonly updateTransaction: number },
    primaryKey: Readonly<Record<string, unknown>>,
    data: readonly AdapterData<UnsupportedField>[],
  ): Promise<void> {
    void model;
    void connection;
    void primaryKey;
    void data;
  }

  getDBName(): string {
    return 'unsupported-update';
  }
}

const unsupportedUpdate = new Toshihiko(new UnsupportedUpdateAdapter());
// @ts-expect-error Core update inputs must satisfy the update contract declared by the Adapter.
unsupportedUpdate.define('unsupported-update', [{ name: 'id' }]);

class StringValueAdapter implements Adapter<unknown, unknown, unknown, string> {
  async find(): Promise<AdapterFindResult> {
    return [];
  }

  async insert(
    model: unknown,
    connection: unknown,
    data: readonly AdapterData<unknown, string>[],
  ): Promise<AdapterRow> {
    void model;
    void connection;
    void data;
    return {};
  }

  async update(
    model: unknown,
    connection: unknown,
    primaryKey: Readonly<Record<string, unknown>>,
    data: readonly AdapterData<unknown, string>[],
  ): Promise<void> {
    void model;
    void connection;
    void primaryKey;
    void data;
  }

  getDBName(): string {
    return 'string-values';
  }
}

const stringValues = new Toshihiko(new StringValueAdapter());
// @ts-expect-error Every schema value must satisfy the Value contract declared by the Adapter.
stringValues.define('numeric-values', [{ name: 'id', type: Type.Integer }]);

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

const invalidInlineSchema = [{
  name: 'score',
  type: Type.Integer,
  default: 'zero',
}] as const;

// @ts-expect-error Schema validation reconnects defaults to their FieldType values.
const invalidValidatedSchema: ValidatedSchema<typeof invalidInlineSchema> = invalidInlineSchema;
void invalidValidatedSchema;

// @ts-expect-error define() validates defaults against the sibling FieldType.
toshihiko.define('invalid-inline-default', [{
  name: 'score',
  type: Type.Integer,
  default: 'zero',
}]);

// @ts-expect-error define() validates validators against the sibling FieldType.
toshihiko.define('invalid-inline-validator', [{
  name: 'score',
  type: Type.Integer,
  async validators(value: string) {
    void value;
  },
}]);

const brokenFieldType = {
  name: 'Broken',
  parse(value: string): number {
    return Number(value);
  },
  restore(value: { readonly unrelated: true }): string {
    return String(value.unrelated);
  },
};

// @ts-expect-error A FieldType must use one Value type across parse() and restore().
toshihiko.define('invalid-field-type', [{ name: 'broken', type: brokenFieldType }]);

const optionalInput: { birthday?: Date | null } = {};
const optionalBuilt = User.build(optionalInput);
const optionalBuiltBirthday: Date | null | undefined = optionalBuilt.birthday;
void optionalBuiltBirthday;

const UndefinedDefault = toshihiko.define('undefined-default', [{
  name: 'label',
  type: Type.String,
  default: undefined,
}]);
const undefinedDefaultValue: string | undefined = UndefinedDefault.build({}).label;
void undefinedDefaultValue;

const dateType: FieldType<Date, string, string> = {
  name: 'DateString',
  parse: (value) => new Date(value),
  restore: (value) => value.toISOString(),
  toJSON: (value) => value.toISOString(),
};
const Dated = toshihiko.define('dated', [{ name: 'date', type: dateType }]);
const serializedDate: string | undefined = Dated.build({
  date: new Date(),
}).toJSON().date;
void serializedDate;

// @ts-expect-error A distinct JsonValue requires a runtime toJSON implementation.
const missingDateSerializer: FieldType<Date, string, string> = {
  name: 'MissingDateSerializer',
  parse: (value) => new Date(value),
  restore: (value) => value.toISOString(),
};
void missingDateSerializer;

const distributedData: YukariFieldData<(typeof User.originalSchema)[number]> = {
  field: User.schema[0],
  value: 1,
};
void distributedData;

const nullableValidator = User.schema[2].validators[0];
if (nullableValidator !== undefined) {
  // @ts-expect-error Validators receive the non-null FieldType value only.
  nullableValidator(null);
}

// @ts-expect-error Yukari API names are rejected before a Model can be created.
toshihiko.define('collision', [{ name: 'insert', type: Type.String }]);

// @ts-expect-error Prototype constructor names are reserved too.
toshihiko.define('constructor-collision', [{ name: 'constructor' }]);

const syncValidator = (value: number): string | void => {
  if (value < 0) {
    return 'score must not be negative';
  }
};

// @ts-expect-error v2 validators must return Promise objects.
toshihiko.define('invalid-sync-validator', [{ name: 'score', type: Type.Integer, validators: syncValidator }]);
