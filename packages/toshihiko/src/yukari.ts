import type { DataRow, DataValue, FieldName } from './contracts/common';
import type {
  Adapter,
  AdapterConnection,
  AdapterData,
  AdapterField,
  AdapterLike,
  AdapterModel,
  AdapterRow,
  AdapterValue,
} from './contracts/adapter';
import type {
  Field,
  FieldDefinitionValue,
  FieldValidator,
  JsonRowFromSchema,
  RowFromSchema,
  SchemaDefinition,
} from './contracts/field';
import { cloneValue } from './contracts/field';
import type {
  BuildInput,
  BuiltRowFromSchema,
  Model,
} from './contracts/model';
import type { QueryWhere } from './query';
import { getAdapterInstance } from './toshihiko';

type YukariSource = 'delete' | 'new' | 'query';

type YukariOriginalData<Schema extends SchemaDefinition> = Partial<{
  [Definition in Schema[number] as Definition['name']]: {
    readonly fieldIdx: number;
    data: FieldDefinitionValue<Definition>;
  };
}>;

/**
 * One compiled Field and application value sent to an Adapter write.
 * @zh 发送给 Adapter 写操作的一个编译后 Field 与应用层值。
 * @ja Adapter の書き込み操作へ送る、1 個のコンパイル済み Field とアプリケーション値です。
 */
export type YukariFieldData<Definition extends SchemaDefinition[number]> =
  Definition extends SchemaDefinition[number]
    ? {
        readonly field: Field<Definition>;
        readonly value: FieldDefinitionValue<Definition>;
      }
    : never;

interface RuntimeField {
  readonly column: string;
  readonly name: string;
  equal(left: DataValue, right: DataValue): boolean;
  parse(value: DataValue): DataValue;
  toJSON(value: DataValue): DataValue;
}

interface RuntimeOriginalEntry {
  readonly fieldIdx: number;
  data: DataValue;
}

type RuntimeOriginalData = Record<string, RuntimeOriginalEntry | undefined>;

/**
 * Yukari created locally by {@link Model.build}, with input-sensitive fields.
 * @zh 由以下方法在本地创建的 Yukari：{@link Model.build}，并保留由输入决定的字段。
 * @ja {@link Model.build} によってローカルで作成され、入力に応じたフィールドを持つ Yukari です。
 */
export type BuiltYukari<
  Name extends string,
  Schema extends SchemaDefinition,
  Input extends BuildInput<Schema>,
  AdapterInstance extends AdapterLike = Adapter,
> = Yukari<Name, Schema, AdapterInstance>
  & Omit<BuiltRowFromSchema<Schema, Input>, keyof Yukari<Name, Schema, AdapterInstance>>;

/**
 * Yukari loaded from storage, with fields optional after projection.
 * @zh 从存储层加载的 Yukari；字段经过投影后为可选。
 * @ja ストレージから読み込まれ、選択されなかったフィールドが任意になっている Yukari です。
 */
export type QueriedYukari<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike = Adapter,
> = Yukari<Name, Schema, AdapterInstance>
  & Omit<Partial<RowFromSchema<Schema>>, keyof Yukari<Name, Schema, AdapterInstance>>;

/**
 * One mutable row belonging to a Model.
 *
 * Schema fields are exposed as enumerable properties on the instance. Use
 * {@link Model.build} to create a new row, or obtain a queried row from
 * {@link Query.find}, {@link Query.findOne}, or {@link Query.findById}.
 *
 * A built row can be inserted. A queried row can be updated or deleted. The
 * original values used to locate and compare a queried row are kept privately.
 * @zh 属于一个 Model 的可变数据行。
 *
 * schema 字段会作为实例的可枚举属性公开。使用
 * {@link Model.build} 创建新数据行，或从以下方法取得查询结果：
 * {@link Query.find}、{@link Query.findOne}，或 {@link Query.findById}。
 *
 * 新建的数据行可以插入；查询得到的数据行可以更新或删除。用于定位和比较查询结果的原始值会保存在私有状态中。
 * @ja 1 個の Model に属する、変更可能なデータ行です。
 *
 * schema のフィールドは、インスタンスの enumerable なプロパティとして公開されます。新しいデータ行は {@link Model.build} で作成します。検索済みのデータ行は {@link Query.find}、{@link Query.findOne}、または {@link Query.findById} から取得します。
 *
 * build したデータ行は insert できます。検索済みのデータ行は update または delete できます。検索済みのデータ行の特定と比較に使用する元の値は、private に保持されます。
 * @category Application API
 * @zh 应用 API
 * @ja アプリケーション API
 */
export class Yukari<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike = Adapter,
> {
  readonly #adapter: AdapterInstance;
  readonly #model: Model<Name, Schema, AdapterInstance>;
  #originalData: YukariOriginalData<Schema>;
  readonly #schema: Model<Name, Schema, AdapterInstance>['schema'];
  #source: YukariSource;

  constructor(
    model: Model<Name, Schema, AdapterInstance>,
    source: 'delete' | 'new' | 'query',
    row: BuildInput<Schema> | DataRow = {},
    rowInOriginalName = false,
  ) {
    this.#adapter = getAdapterInstance(model.parent);
    this.#model = model;
    this.#originalData = {};
    this.#schema = model.schema;
    this.#source = source;
    if (source === 'new') {
      this.#buildNewRow(row as BuildInput<Schema>, rowInOriginalName);
    } else {
      this.#fillRowFromSource(row, rowInOriginalName);
    }
  }

  #buildNewRow(fields: BuildInput<Schema>, rowInOriginalName = false): void {
    this.#originalData = {};
    const input = fields as Readonly<Record<string, unknown>>;

    for (const field of this.#schema) {
      const runtimeField = field as unknown as RuntimeField;
      const suppliedValue = input[rowInOriginalName ? field.column : field.name];
      const value = suppliedValue === undefined
        ? field.defaultValue
        : suppliedValue;

      if (value === undefined) {
        continue;
      }

      Object.defineProperty(this, field.name, {
        configurable: false,
        enumerable: true,
        value: cloneValue(value),
        writable: true,
      });
    }
  }

  #fillRowFromSource(
    row: Readonly<Record<string, unknown>>,
    rowInOriginalName = false,
  ): void {
    const originalData: Record<string, {
      readonly fieldIdx: number;
      data: FieldDefinitionValue<Schema[number]>;
    }> = {};
    this.#originalData = originalData as YukariOriginalData<Schema>;

    for (const [fieldIdx, field] of this.#schema.entries()) {
      const runtimeField = field as unknown as RuntimeField;
      const sourceName = rowInOriginalName ? runtimeField.column : runtimeField.name;
      const sourceValue = row[sourceName];
      if (sourceValue === undefined) {
        continue;
      }

      const parsed = (sourceValue === null
        ? null
        : runtimeField.parse(sourceValue)) as FieldDefinitionValue<Schema[number]>;
      originalData[runtimeField.name] = {
        fieldIdx,
        data: parsed,
      };
    }

    for (const [name, entry] of Object.entries(originalData)) {
      Object.defineProperty(this, name, {
        configurable: false,
        enumerable: true,
        value: cloneValue(entry.data),
        writable: true,
      });
    }

  }

  #fieldIndex(name: string): number {
    if (this.#source !== 'new') {
      const originalData = this.#originalData as unknown as RuntimeOriginalData;
      return originalData[name]?.fieldIdx ?? -1;
    }

    return this.#schema.findIndex((field) => field.name === name);
  }

  /**
   * Runs the validators for one schema field.
   *
   * Nullable fields accept `null` without running custom validators. Each
   * validator runs with `this` bound to the row's Model.
   * @zh 运行一个 schema 字段的 validator。
   *
   * 可为 null 的字段接受 `null`，但不会运行自定义 validator。每个 validator 的 this 都绑定到 `this`，其 this 绑定到该数据行的 Model。
   * @ja schema の 1 フィールドに対して validator を実行します。
   *
   * nullable なフィールドでは、カスタム validator を実行せずに `null` を受け付けます。各 validator の `this` は、データ行の Model に bind されます。
   * @param name - Logical field name from the Model schema.
   * @zh name - Model schema 中的逻辑字段名。
   * @ja name - Model の schema に含まれる論理フィールド名です。
   * @param value - Application value to validate.
   * @zh value - 要验证的应用层值。
   * @ja value - 検証するアプリケーション値です。
   * @throws When the field does not exist, a non-nullable field receives
   * `null`, or a validator returns a non-empty error message.
   * @zh 字段不存在、不可为 null 的字段收到以下值时：
   * `null`，或 validator 返回非空错误信息。
   * @ja フィールドが存在しない場合、`null` を許可しないフィールドに `null` が渡された場合、または Validator が空ではないエラーメッセージを返した場合です。
   */
  async validateOne<Field extends FieldName<RowFromSchema<Schema>>>(
    name: Field,
    value: RowFromSchema<Schema>[Field],
  ): Promise<void> {
    await this.#validateField(name, value);
  }

  /**
   * Validates every enumerable property mapped to a schema field.
   *
   * Functions, compatibility properties whose names start with `$`, and
   * properties absent from the schema are ignored. At most ten fields are
   * validated concurrently.
   * @zh 验证每个映射到 schema 字段的可枚举属性。
   *
   * 函数、名称以下列内容开头的兼容属性：`$`；schema 中不存在的属性会被忽略。最多并发验证十个字段。
   * @ja schema のフィールドに対応する、列挙可能なすべてのプロパティを検証します。
   *
   * 関数、名前が `$` で始まる互換プロパティ、schema に存在しないプロパティは無視します。同時に検証するフィールドは最大 10 個です。
   * @throws The first validation error produced by {@link validateOne}.
   * @zh 以下方法产生的第一条验证错误：{@link validateOne}。
   * @ja {@link validateOne} が生成した最初の検証エラーです。
   */
  async validateAll(): Promise<void> {
    const values = this as Readonly<Record<string, unknown>>;
    const names = Object.keys(this).filter((name) => (
      !name.startsWith('$')
      && typeof values[name] !== 'function'
      && this.#fieldIndex(name) !== -1
    ));
    let index = 0;
    const workers = Array.from(
      { length: Math.min(10, names.length) },
      async () => {
        while (index < names.length) {
          const name = names[index++]!;
          await this.#validateField(name, values[name]);
        }
      },
    );
    await Promise.all(workers);
  }

  /**
   * Validates and inserts a row created by {@link Model.build}.
   *
   * Values returned by the Adapter, such as an auto-incremented primary key,
   * are copied onto this same Yukari instance.
   * @zh 验证并插入由以下方法创建的数据行：{@link Model.build}。
   *
   * Adapter 返回的值（例如自增主键）会复制到同一个 Yukari 实例上。
   * @ja {@link Model.build} で作成したデータ行を検証して insert します。
   *
   * 自動インクリメントされた主キーなど、Adapter が返した値は同じ Yukari インスタンスへコピーされます。
   * @param connection - Optional Adapter transaction connection.
   * @zh connection - 可选的 Adapter 事务连接。
   * @ja connection - 任意の Adapter トランザクション接続です。
   * @returns This Yukari instance after the write completes.
   * @zh 写操作完成后的当前 Yukari 实例。
   * @ja 書き込み完了後の、この Yukari インスタンスです。
   * @throws When called on a row loaded from the database, or validation or
   * Adapter execution fails.
   * @zh 在数据库加载的数据行上调用，或验证、Adapter 执行失败时。
   * @ja データベースから読み込んだデータ行で呼び出した場合、検証に失敗した場合、または Adapter の実行に失敗した場合です。
   */
  async insert(
    connection: AdapterConnection<AdapterInstance> | null = null,
  ): Promise<this> {
    if (this.#source !== 'new') {
      throw new Error('You must call this function via a new Yukari object.');
    }
    await this.validateAll();

    const adapter = this.#adapter as unknown as Adapter<
      AdapterModel<AdapterInstance>,
      AdapterConnection<AdapterInstance>,
      AdapterField<AdapterInstance>,
      AdapterValue<AdapterInstance>
    >;
    const data = extractAdapterData(
      this.#model,
      this as unknown as Partial<RowFromSchema<Schema>>,
    );
    const row = await adapter.insert(
      this.#model as unknown as AdapterModel<AdapterInstance>,
      connection,
      data as unknown as readonly AdapterData<
        AdapterField<AdapterInstance>,
        AdapterValue<AdapterInstance>
      >[],
    );
    if (row !== null && row !== undefined) {
      for (const key of Object.keys(row)) {
        const value = (row as Readonly<Record<string, unknown>>)[key];
        if (key.startsWith('$') || typeof value === 'function') {
          continue;
        }
        Reflect.set(this, key, cloneValue(value));
      }
    }
    return this;
  }

  /**
   * Updates a row loaded from the database.
   *
   * Changed fields are detected against the private original-value snapshot.
   * The original primary-key values locate the row, so changing a primary-key
   * property does not lose the original locator. When no value changed, the
   * complete mapped row is sent for v1-compatible behavior.
   * @zh 更新从数据库加载的数据行。
   *
   * 变更字段会与私有原始值快照比较。数据行通过原始主键值定位，因此修改主键属性不会丢失原始定位条件。没有值发生变化时，为兼容 v1 会发送完整映射后的数据行。
   * @ja データベースから読み込んだデータ行を更新します。
   *
   * 変更されたフィールドは、private に保持された元の値の snapshot と比較して検出します。データ行の特定には元の主キー値を使用するため、主キープロパティを変更しても元の特定条件は失われません。値が変更されていない場合は、v1 と互換の挙動として map 済みの完全なデータ行を送ります。
   * @param connection - Optional Adapter transaction connection.
   * @zh connection - 可选的 Adapter 事务连接。
   * @ja connection - 任意の Adapter トランザクション接続です。
   * @returns This Yukari instance with its original snapshot refreshed.
   * @zh 刷新原始快照后的当前 Yukari 实例。
   * @ja 元の値のスナップショットを更新した、この Yukari インスタンスです。
   * @throws When called on a newly built row, or validation or Adapter
   * execution fails.
   * @zh 在新建数据行上调用，或验证、Adapter 执行失败时。
   * @ja 新しく構築したデータ行で呼び出した場合、検証に失敗した場合、または Adapter の実行に失敗した場合です。
   */
  async update(
    connection: AdapterConnection<AdapterInstance> | null = null,
  ): Promise<this> {
    if (this.#source === 'new') {
      throw new Error('You must call this function via an old Yukari object.');
    }

    let data = this.#updateChanges();
    if (data.length === 0) {
      data = extractAdapterData(
        this.#model,
        this as unknown as Partial<RowFromSchema<Schema>>,
      );
    }
    const primaryKey = this.#originalLocator();
    await this.validateAll();

    const adapter = this.#adapter as unknown as Adapter<
      AdapterModel<AdapterInstance>,
      AdapterConnection<AdapterInstance>,
      AdapterField<AdapterInstance>,
      AdapterValue<AdapterInstance>
    >;
    await adapter.update(
      this.#model as unknown as AdapterModel<AdapterInstance>,
      connection,
      primaryKey,
      data as unknown as readonly AdapterData<
        AdapterField<AdapterInstance>,
        AdapterValue<AdapterInstance>
      >[],
    );
    const originalData = this.#originalData as unknown as RuntimeOriginalData;
    for (const entry of data) {
      const field = entry.field as Field<Schema[number]>;
      originalData[field.name]!.data = entry.value;
    }
    this.#source = 'query';
    return this;
  }

  /**
   * Deletes a row loaded from the database.
   *
   * The delete condition uses original primary-key values. If the Model has no
   * primary key, all original fields form the locator. At most one row is
   * requested from the Adapter.
   * @zh 删除从数据库加载的数据行。
   *
   * 删除条件使用原始主键值。如果 Model 没有主键，则用所有原始字段定位。Adapter 最多会被要求返回一行。
   * @ja データベースから読み込んだデータ行を削除します。
   *
   * delete の条件には元の主キー値を使用します。Model に主キーがない場合は、元のすべてのフィールドを特定条件に使用します。Adapter に要求するデータ行は最大 1 行です。
   * @param connection - Optional Adapter transaction connection.
   * @zh connection - 可选的 Adapter 事务连接。
   * @ja connection - 任意の Adapter トランザクション接続です。
   * @returns `true` after the Adapter reports a successful deletion.
   * @zh `true`，在 Adapter 报告删除成功后返回。
   * @ja Adapter が削除成功を報告した後の `true` です。
   * @throws When called on a newly built row or when the Adapter returns a
   * falsy result.
   * @zh 在新建数据行上调用，或 Adapter 返回假值时。
   * @ja 新しく構築したデータ行で呼び出した場合、または Adapter が偽と評価される結果を返した場合です。
   */
  async delete(
    connection: AdapterConnection<AdapterInstance> | null = null,
  ): Promise<true> {
    if (this.#source === 'new') {
      throw new Error("You can't call this function via a new Yukari object.");
    }

    const primaryKey = this.#originalLocator();
    const query = this.#model
      .where(primaryKey as QueryWhere<RowFromSchema<Schema>>)
      .limit(0, 1);
    query.conn(connection);

    const result = await query.delete();
    if (!result) {
      throw new Error('unknown error.');
    }
    this.#source = 'delete';
    return true;
  }

  /**
   * Inserts a newly built row or updates a row loaded from the database.
   * @zh 插入新建的数据行，或更新从数据库加载的数据行。
   * @ja 新しく構築したデータ行を insert するか、データベースから読み込んだデータ行を update します。
   * @param connection - Optional Adapter transaction connection.
   * @zh connection - 可选的 Adapter 事务连接。
   * @ja connection - 任意の Adapter トランザクション接続です。
   * @returns This Yukari instance after the selected write completes.
   * @zh 所选写操作完成后的当前 Yukari 实例。
   * @ja 選択された書き込みの完了後の、この Yukari インスタンスです。
   */
  async save(
    connection: AdapterConnection<AdapterInstance> | null = null,
  ): Promise<this> {
    if (this.#source === 'new') {
      return this.insert(connection);
    }
    return this.update(connection);
  }

  /**
   * Serializes mapped fields with each Field Type's `toJSON()` implementation.
   * @zh 使用每个 Field Type 的以下方法序列化映射字段：`toJSON()` 实现。
   * @ja 各 Field Type の `toJSON()` 実装を使用して、対応付け済みのフィールドをシリアライズします。
   * @param useOriginalData - Serialize the original database snapshot instead
   * of the current enumerable properties.
   * @zh useOriginalData - 序列化数据库原始快照，而不是当前的可枚举属性。
   * @ja useOriginalData - 現在の列挙可能なプロパティではなく、データベースから取得した元のスナップショットをシリアライズします。
   * @returns A plain object keyed by logical schema field names.
   * @zh 以逻辑 schema 字段名为键的普通对象。
   * @ja 論理 schema フィールド名をキーとする通常のオブジェクトです。
   * @example
   * ```ts
   * const current = user.toJSON();
   * const beforeChanges = user.toJSON(true);
   * ```
   */
  toJSON(useOriginalData = false): Partial<JsonRowFromSchema<Schema>> {
    const result: Record<string, unknown> = {};
    const values = this as Readonly<Record<string, unknown>>;
    const originalData = this.#originalData as unknown as RuntimeOriginalData;

    const names = useOriginalData ? Object.keys(originalData) : Object.keys(this);
    for (const name of names) {
      const value = useOriginalData ? originalData[name]?.data : values[name];
      if (!useOriginalData && (name.startsWith('$') || typeof value === 'function')) continue;
      const fieldIdx = useOriginalData ? originalData[name]!.fieldIdx : this.#fieldIndex(name);
      const field = this.#schema[fieldIdx] as unknown as RuntimeField | undefined;
      result[name] = field === undefined
        ? value
        : field.toJSON(value as DataValue);
    }

    return result as Partial<JsonRowFromSchema<Schema>>;
  }

  #originalLocator(): DataRow {
    const originalData = this.#originalData as unknown as RuntimeOriginalData;
    const primaryKey: Record<string, DataValue> = {};
    if (this.#model.primaryKeys.length > 0) {
      for (const field of this.#model.primaryKeys) {
        const original = originalData[field.name];
        if (original !== undefined) primaryKey[field.name] = original.data;
      }
      return primaryKey;
    }
    for (const [name, original] of Object.entries(originalData)) {
      if (original !== undefined) primaryKey[name] = original.data;
    }
    return primaryKey;
  }

  #updateChanges(): readonly YukariFieldData<Schema[number]>[] {
    const values = this as Readonly<Record<string, unknown>>;
    const originalData = this.#originalData as unknown as RuntimeOriginalData;
    const changes: YukariFieldData<Schema[number]>[] = [];
    for (const name of Object.keys(this)) {
      if (name.startsWith('$') || typeof values[name] === 'function') continue;
      const fields = this.#model.fieldNamesMap as unknown as Readonly<Record<string, Field<Schema[number]> | undefined>>;
      const field = fields[name];
      if (field === undefined) continue;
      const original = originalData[name];
      // v1 reads the original snapshot directly and lets JavaScript surface a
      // native TypeError when a queried row contains a field absent from it.
      const originalValue = original!.data;
      const current = values[name] as FieldDefinitionValue<Schema[number]>;
      if ((current === null || originalValue === null)
        && current !== originalValue
        && field.allowNull) {
        changes.push({ field, value: current } as YukariFieldData<Schema[number]>);
      } else if (!field.equal(current, originalValue as FieldDefinitionValue<Schema[number]>)) {
        changes.push({ field, value: current } as YukariFieldData<Schema[number]>);
      }
    }
    return changes;
  }

  async #validateField(name: string, value: unknown): Promise<void> {
    const fieldIndex = this.#fieldIndex(name);
    const field = fieldIndex === -1 ? undefined : this.#schema[fieldIndex];
    if (field === undefined) {
      throw new Error(`No such field ${name}`);
    }

    if (value === null) {
      if (!field.allowNull) {
        throw new Error(`Field ${name} can't be null.`);
      }
      return;
    }

    for (const validator of field.validators) {
      const message = await callValidator(validator, this.#model, value);
      if (typeof message === 'string' && message.length > 0) {
        throw new Error(message);
      }
    }
  }
}

function extractAdapterData<
  Name extends string,
  Schema extends SchemaDefinition,
  AdapterInstance extends AdapterLike,
>(
  model: Model<Name, Schema, AdapterInstance>,
  data: Partial<RowFromSchema<Schema>>,
): readonly YukariFieldData<Schema[number]>[] {
  const values = data as Readonly<Record<string, unknown>>;
  const extracted: YukariFieldData<Schema[number]>[] = [];

  for (const name of Object.keys(data)) {
    if (name.startsWith('$')) continue;
    const fields = model.fieldNamesMap as unknown as Readonly<Record<string, Field<Schema[number]> | undefined>>;
    const field = fields[name];
    if (field === undefined) continue;
    extracted.push({
      field,
      value: values[name] as FieldDefinitionValue<Schema[number]>,
    } as YukariFieldData<Schema[number]>);
  }

  return extracted;
}

function callValidator<Value>(
  validator: FieldValidator<Value>,
  model: object,
  value: unknown,
): ReturnType<FieldValidator<Value>> {
  const callable = validator as unknown as (
    this: object,
    input: unknown,
  ) => ReturnType<FieldValidator<Value>>;
  return callable.call(model, value);
}
