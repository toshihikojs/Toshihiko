import { Type } from '../field-types';
import type { DataValue } from './common';

const cloneDeep = require('lodash/cloneDeep') as <Value>(value: Value) => Value;
const otrans = require('otrans') as {
  toCamel(value: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>>;
};

declare const fieldTypeValue: unique symbol;
declare const fieldTypeStorageValue: unique symbol;
declare const fieldTypeJsonValue: unique symbol;

type SameType<Left, Right> =
  [Left] extends [Right]
    ? [Right] extends [Left] ? true : false
    : false;

type FieldTypeJsonMethod<Value, JsonValue> = SameType<Value, JsonValue> extends true
  ? { readonly toJSON?: (value: Value) => JsonValue }
  : { readonly toJSON: (value: Value) => JsonValue };

/**
 * Defines conversion between storage, application, and JSON values.
 * @zh 定义存储层、应用层和 JSON 值之间的转换。
 * @ja ストレージ値、アプリケーション値、JSON 値の間の変換を定義します。
 * @category Schema and fields
 * @zh Schema 与字段
 * @ja Schema とフィールド
 */
export type FieldType<
  Value,
  StorageValue = Value,
  JsonValue = Value,
> = {
  readonly [fieldTypeValue]?: Value;
  readonly [fieldTypeStorageValue]?: StorageValue;
  readonly [fieldTypeJsonValue]?: JsonValue;
  /**
   * Human-readable Field Type name.
   * @zh 便于阅读的 Field Type 名称。
   * @ja 人が読める Field Type 名です。
   */
  readonly name?: string;
  /**
   * Whether SQL adapters should quote restored values.
   * @zh SQL Adapter 是否应为还原后的值加引号。
   * @ja SQL Adapter が `restore()` 後の値を引用符で囲むかどうかです。
   */
  readonly needQuotes?: boolean;
  /**
   * Default application value used when a field omits `defaultValue`.
   * @zh 字段省略 `defaultValue` 时使用的默认应用层值。
   * @ja フィールドで `defaultValue` を省略した場合に使用する、既定のアプリケーション値です。
   */
  readonly defaultValue?: Value;
  /**
   * Converts a storage value into its application representation.
   * @zh 把存储层值转换为应用层表示。
   * @ja ストレージ値をアプリケーション側の表現へ変換します。
   */
  parse(value: StorageValue): Value;
  /**
   * Converts an application value into its storage representation.
   * @zh 把应用层值转换为存储层表示。
   * @ja アプリケーション値をストレージ側の表現へ変換します。
   */
  restore(value: Value): StorageValue;
  /**
   * Compares two application values for change detection.
   * @zh 比较两个应用层值，用于检测变更。
   * @ja 変更を検出するために、2 つのアプリケーション値を比較します。
   */
  equal?(left: Value, right: Value): boolean;
} & FieldTypeJsonMethod<Value, JsonValue>;

export interface FieldTypeLike {
  readonly [fieldTypeValue]?: DataValue;
  readonly [fieldTypeStorageValue]?: DataValue;
  readonly [fieldTypeJsonValue]?: DataValue;
  readonly name?: string;
  readonly needQuotes?: boolean;
  readonly defaultValue?: DataValue;
  parse(value: never): DataValue;
  restore(value: never): DataValue;
  equal?(left: never, right: never): boolean;
  toJSON?(value: never): DataValue;
}

export type FieldTypeValue<Type extends FieldTypeLike> =
  typeof fieldTypeValue extends keyof Type
    ? Exclude<Type[typeof fieldTypeValue], undefined>
    : ReturnType<Type['parse']>;

/**
 * Resolves the storage value returned by a Field Type's `restore()` method.
 * @zh 解析 Field Type 的以下方法返回的存储层值：`restore()` 方法。
 * @ja Field Type の `restore()` メソッドが返すストレージ値を解決します。
 */
export type FieldTypeStorageValue<Type extends FieldTypeLike> =
  ReturnType<Type['restore']>;

/**
 * A validator executed before a Yukari row is written.
 * @zh 写入 Yukari 数据行前执行的 validator。
 * @ja Yukari のデータ行を書き込む前に実行する validator です。
 * @category Schema and fields
 * @zh Schema 与字段
 * @ja Schema とフィールド
 */
export type FieldValidator<Value> = (
  value: Value,
) => string | void | Promise<string | void>;

/**
 * The common shape accepted for one entry in a Toshihiko schema.
 *
 * Use {@link FieldDefinition} when a reusable declaration should retain its
 * literal field name and concrete Field Type. This broader interface is the
 * structural constraint used by {@link SchemaDefinition}.
 * @zh Toshihiko schema 中一个条目接受的通用结构。
 *
 * 请在以下场景使用 {@link FieldDefinition}，适用于可复用声明需要保留字段字面量名称和具体 Field Type 的场景。这个较宽的接口也是以下类型使用的结构约束：{@link SchemaDefinition}。
 * @ja Toshihiko の schema に含まれる 1 項目が受け付ける共通の構造です。
 *
 * 再利用する宣言でフィールド名の literal と具体的な Field Type を維持する場合は、{@link FieldDefinition} を使用してください。この広いインターフェースは {@link SchemaDefinition} の構造的制約として使用されます。
 * @category Schema and fields
 * @zh Schema 与字段
 * @ja Schema とフィールド
 */
export interface SchemaFieldDefinition {
  /**
   * Logical property name exposed on Yukari rows.
   * @zh Yukari 数据行公开的逻辑属性名。
   * @ja Yukari のデータ行に公開する論理プロパティ名です。
   */
  readonly name: string;
  /**
   * Storage column name; defaults to {@link name}.
   * @zh 存储列名；默认值为 {@link name}。
   * @ja ストレージ列名です。既定値は {@link name} です。
   */
  readonly column?: string;
  /**
   * Value conversion contract; defaults to `Type.String`.
   * @zh 值转换契约；默认值为 `Type.String`。
   * @ja 値変換の契約です。既定値は `Type.String` です。
   */
  readonly type?: FieldTypeLike;
  /**
   * One validator or a list executed before writes.
   * @zh 写入前执行的一个 validator 或 validator 列表。
   * @ja 書き込み前に実行する 1 個の validator、または validator の一覧です。
   */
  readonly validators?:
    | FieldValidator<never>
    | readonly FieldValidator<never>[];
  /**
   * Whether the application value may be `null`.
   * @zh 应用层值是否可以为 `null`。
   * @ja アプリケーション値に `null` を使用できるかどうかです。
   */
  readonly allowNull?: boolean;
  /**
   * Whether the field participates in primary-key lookups and row locators.
   * @zh 字段是否参与主键查询和数据行定位。
   * @ja 主キー検索とデータ行の特定にこのフィールドを使用するかどうかです。
   */
  readonly primaryKey?: boolean;
  /**
   * Whether the storage backend generates this field on insert.
   * @zh 存储后端是否会在 insert 时生成此字段。
   * @ja insert 時にストレージバックエンドがこのフィールドを生成するかどうかです。
   */
  readonly autoIncrement?: boolean;
  /**
   * Application value used when a newly built row omits this field.
   * @zh 新建数据行省略此字段时使用的应用层值。
   * @ja 新しく構築したデータ行でこのフィールドが省略された場合に使用するアプリケーション値です。
   */
  readonly defaultValue?: DataValue;
}

/**
 * A schema entry which retains its field name and Field Type.
 * @zh 保留字段名和 Field Type 的 schema 条目。
 * @ja フィールド名と Field Type を維持する schema 項目です。
 * @category Schema and fields
 * @zh Schema 与字段
 * @ja Schema とフィールド
 */
export interface FieldDefinition<
  Name extends string = string,
  FieldTypeDefinition extends FieldTypeLike = FieldTypeLike,
> extends SchemaFieldDefinition {
  /**
   * Literal logical property name retained for schema inference.
   * @zh 为 schema 推断保留的逻辑属性字面量名称。
   * @ja schema の推論で維持される、論理プロパティ名のリテラルです。
   */
  readonly name: Name;
  /**
   * Storage column name; defaults to {@link name}.
   * @zh 存储列名；默认值为 {@link name}。
   * @ja ストレージ列名です。既定値は {@link name} です。
   */
  readonly column?: string;
  /**
   * Concrete Field Type retained for value inference.
   * @zh 用于值推断的具体 Field Type。
   * @ja 値の推論に維持される具体的な Field Type です。
   */
  readonly type?: FieldTypeDefinition;
  /**
   * Validators receiving the inferred application value.
   * @zh 接收推断后应用层值的 validator。
   * @ja 推論されたアプリケーション値を受け取る validator です。
   */
  readonly validators?:
    | FieldValidator<FieldTypeValue<FieldTypeDefinition>>
    | readonly FieldValidator<FieldTypeValue<FieldTypeDefinition>>[];
  /**
   * Whether the inferred application value includes `null`.
   * @zh 推断后的应用层值是否包含 `null`。
   * @ja 推論されたアプリケーション値に `null` が含まれるかどうかです。
   */
  readonly allowNull?: boolean;
  /**
   * Whether the field participates in primary-key lookup.
   * @zh 字段是否参与主键查询。
   * @ja 主キー検索にこのフィールドを使用するかどうかです。
   */
  readonly primaryKey?: boolean;
  /**
   * Whether the storage backend generates this field on insert.
   * @zh 存储后端是否会在 insert 时生成此字段。
   * @ja insert 時にストレージバックエンドがこのフィールドを生成するかどうかです。
   */
  readonly autoIncrement?: boolean;
  /**
   * Application value used when a newly built row omits this field.
   * @zh 新建数据行省略此字段时使用的应用层值。
   * @ja 新しく構築したデータ行でこのフィールドが省略された場合に使用するアプリケーション値です。
   */
  readonly defaultValue?: FieldTypeValue<FieldTypeDefinition> | undefined;
}

/**
 * A readonly list of field definitions accepted by {@link Toshihiko.define}.
 *
 * An ordinary array literal passed directly to `define()` retains each field's
 * literal name and Field Type.
 * @zh 以下方法接受的只读字段定义列表：{@link Toshihiko.define}。
 *
 * 直接传给以下方法的普通数组字面量：`define()` 会保留每个字段的字面量名称和 Field Type。
 * @ja {@link Toshihiko.define} が受け付ける、読み取り専用のフィールド定義一覧です。
 *
 * 通常の配列 literal を `define()` に直接渡すと、各フィールド名の literal と Field Type が維持されます。
 * @example
 * ```ts
 * const User = database.define('user', [
 *   { name: 'id', type: Type.Integer, primaryKey: true },
 *   { name: 'email', type: Type.String },
 * ]);
 * ```
 * @category Schema and fields
 * @zh Schema 与字段
 * @ja Schema とフィールド
 */
export type SchemaDefinition = readonly SchemaFieldDefinition[];

/**
 * Resolves the concrete Field Type used by one schema entry.
 * @zh 解析一个 schema 条目使用的具体 Field Type。
 * @ja schema の 1 項目で使用する具体的な Field Type を解決します。
 */
export type FieldTypeFromDefinition<Definition extends SchemaFieldDefinition> =
  Definition extends { readonly type: infer FieldTypeDefinition extends FieldTypeLike }
    ? FieldTypeDefinition
    : typeof Type.String;

type NullableValue<Definition extends SchemaFieldDefinition> =
  Definition extends { readonly allowNull: true } ? null : never;

/**
 * Resolves one schema entry's application value, including nullable fields.
 * @zh 解析一个 schema 条目的应用层值，包括可为 null 的字段。
 * @ja null を許可するフィールドを含め、schema の 1 項目からアプリケーション値を解決します。
 */
export type FieldDefinitionValue<Definition extends SchemaFieldDefinition> =
  | FieldTypeValue<FieldTypeFromDefinition<Definition>>
  | NullableValue<Definition>;

/**
 * Resolves one schema entry's non-null application value.
 * @zh 解析一个 schema 条目的非 null 应用层值。
 * @ja schema の 1 項目から、null ではないアプリケーション値を解決します。
 */
export type FieldDefinitionNonNullValue<Definition extends SchemaFieldDefinition> =
  FieldTypeValue<FieldTypeFromDefinition<Definition>>;

/**
 * Resolves the storage value produced by one schema entry's Field Type.
 * @zh 解析一个 schema 条目的 Field Type 生成的存储层值。
 * @ja schema の 1 項目の Field Type が生成するストレージ値を解決します。
 */
export type FieldDefinitionStorageValue<Definition extends SchemaFieldDefinition> =
  FieldTypeStorageValue<FieldTypeFromDefinition<Definition>>;

/**
 * Resolves the JSON value produced by one schema entry's Field Type.
 * @zh 解析一个 schema 条目的 Field Type 生成的 JSON 值。
 * @ja schema の 1 項目の Field Type が生成する JSON 値を解決します。
 */
export type FieldDefinitionJsonValue<Definition extends SchemaFieldDefinition> =
  null extends FieldDefinitionValue<Definition>
    ? FieldTypeJsonValue<FieldTypeFromDefinition<Definition>> | null
    : FieldTypeJsonValue<FieldTypeFromDefinition<Definition>>;

type FieldTypeJsonValue<Type extends FieldTypeLike> =
  typeof fieldTypeJsonValue extends keyof Type
    ? Exclude<Type[typeof fieldTypeJsonValue], undefined>
    : Type extends { toJSON(value: never): infer JsonValue }
      ? JsonValue
      : FieldTypeValue<Type>;

/**
 * Maps a Schema to its serialized row object.
 * @zh 把 Schema 映射为序列化数据行对象。
 * @ja Schema をシリアライズ済みのデータ行オブジェクトへ変換します。
 */
export type JsonRowFromSchema<Schema extends SchemaDefinition> = {
  [Definition in Schema[number] as Definition['name']]:
    FieldDefinitionJsonValue<Definition>;
};

export type ValidatedFieldDefinition<Definition extends SchemaFieldDefinition> = Omit<
  Definition,
  'defaultValue' | 'type' | 'validators'
> & {
  readonly type?: Definition extends {
    readonly type: infer FieldTypeDefinition extends FieldTypeLike;
  }
    ? ValidatedFieldType<FieldTypeDefinition>
    : FieldTypeLike;
  readonly defaultValue?: FieldDefinitionValue<Definition> | undefined;
  readonly validators?:
    | FieldValidator<FieldDefinitionNonNullValue<Definition>>
    | readonly FieldValidator<FieldDefinitionNonNullValue<Definition>>[];
};

type HasValidEqual<Type extends FieldTypeLike, Value> =
  Type extends { equal(left: infer Left, right: infer Right): boolean }
    ? SameType<Left, Value> extends true
      ? SameType<Right, Value>
      : false
    : true;

type HasValidToJSON<Type extends FieldTypeLike, Value> =
  Type extends { toJSON(value: infer Input): DataValue }
    ? SameType<Input, Value>
    : true;

/**
 * Verifies that a Field Type's conversion and comparison methods agree on the
 * same application and storage values. Invalid definitions resolve to `never`.
 * @zh 验证 Field Type 的转换与比较方法是否对同一组应用层值和存储层值保持一致。无效定义会解析为 `never`。
 * @ja Field Type の変換メソッドと比較メソッドが、同じアプリケーション値とストレージ値に対して整合していることを検証します。無効な定義は `never` に解決されます。
 */
export type ValidatedFieldType<Type extends FieldTypeLike> =
  Type extends {
    parse(value: infer StorageValue): infer Value;
    restore(value: infer RestoredValue): infer RestoredStorageValue;
  }
    ? SameType<RestoredValue, Value> extends true
      ? RestoredStorageValue extends StorageValue
        ? HasValidEqual<Type, Value> extends true
          ? HasValidToJSON<Type, Value> extends true ? Type : never
          : never
        : never
      : never
    : never;

/**
 * Applies Field Type and validator consistency checks to every schema entry.
 * @zh 对每个 schema 条目检查 Field Type 与 validator 的一致性。
 * @ja すべての schema 項目に Field Type と validator の整合性検査を適用します。
 */
export type ValidatedSchema<Schema extends SchemaDefinition> = {
  readonly [Index in keyof Schema]: Schema[Index] extends SchemaFieldDefinition
    ? ValidatedFieldDefinition<Schema[Index]>
    : never;
};

/**
 * Maps a Schema to its application row object.
 * @zh 把 Schema 映射为应用层数据行对象。
 * @ja Schema をアプリケーション側のデータ行オブジェクトへ変換します。
 */
export type RowFromSchema<Schema extends SchemaDefinition> = {
  [Definition in Schema[number] as Definition['name']]: FieldDefinitionValue<Definition>;
};

/**
 * Extracts the logical names of fields marked with `primaryKey: true`.
 * @zh 提取带有以下标记的字段逻辑名：`primaryKey: true`。
 * @ja `primaryKey: true` が指定されたフィールドの論理名を抽出します。
 */
export type PrimaryKeyNames<Schema extends SchemaDefinition> = Extract<
  Schema[number],
  { readonly primaryKey: true }
>['name'];

/**
 * The runtime representation of one compiled schema entry.
 * @zh 一个编译后 schema 条目的运行时表示。
 * @ja コンパイル済み schema の 1 項目を表す実行時オブジェクトです。
 * @category Schema and fields
 * @zh Schema 与字段
 * @ja Schema とフィールド
 */
export class Field<
  Definition extends SchemaFieldDefinition = SchemaFieldDefinition,
> {
  /**
   * Normalized field options.
   * @zh 规范化后的字段选项。
   * @ja 正規化済みのフィールドオプションです。
   */
  declare readonly options: Readonly<Definition>;
  /**
   * Logical property name exposed on Yukari rows.
   * @zh Yukari 数据行公开的逻辑属性名。
   * @ja Yukari のデータ行に公開する論理プロパティ名です。
   */
  declare readonly name: Definition['name'];
  /**
   * Storage column name used by Adapters.
   * @zh Adapter 使用的存储列名。
   * @ja Adapter が使用するストレージ列名です。
   */
  declare readonly column: string;
  /**
   * Field Type used for parsing, restoring, comparison, and JSON conversion.
   * @zh 用于解析、还原、比较和 JSON 转换的 Field Type。
   * @ja `parse()`、`restore()`、比較、JSON 変換に使用する Field Type です。
   */
  declare readonly type: FieldTypeFromDefinition<Definition>;
  /**
   * Normalized validator list.
   * @zh 规范化后的 validator 列表。
   * @ja 正規化済みの validator 一覧です。
   */
  declare readonly validators: readonly FieldValidator<FieldDefinitionNonNullValue<Definition>>[];
  /**
   * Whether the field accepts `null`.
   * @zh 字段是否接受 `null`。
   * @ja フィールドが `null` を受け付けるかどうかです。
   */
  declare readonly allowNull: boolean;
  /**
   * Whether the field participates in row locators.
   * @zh 字段是否参与数据行定位。
   * @ja データ行の特定条件にこのフィールドを使用するかどうかです。
   */
  declare readonly primaryKey: boolean;
  /**
   * Whether the storage backend generates this field.
   * @zh 存储后端是否会生成此字段。
   * @ja ストレージバックエンドがこのフィールドを生成するかどうかです。
   */
  declare readonly autoIncrement: boolean;
  /**
   * Resolved schema or Field Type default.
   * @zh 解析后的 schema 或 Field Type 默认值。
   * @ja 解決後の schema または Field Type の既定値です。
   */
  declare readonly default: FieldDefinitionValue<Definition> | undefined;

  constructor(definition: Definition & ValidatedFieldDefinition<Definition>) {
    if (!definition.name) {
      throw new Error('no field name specified.');
    }

    const normalized = normalizeDefinition(definition);
    const candidateType = normalized.type as FieldTypeLike | undefined;
    const type = (isRuntimeFieldType(candidateType) ? candidateType : Type.String) as FieldTypeFromDefinition<Definition>;
    const validators = normalizeValidators<FieldDefinitionNonNullValue<Definition>>(
      normalized.validators as
        | FieldValidator<FieldDefinitionNonNullValue<Definition>>
        | readonly FieldValidator<FieldDefinitionNonNullValue<Definition>>[]
        | undefined,
    );
    if (typeof normalized.validators === 'function') {
      (normalized as { validators?: unknown }).validators = validators;
    }
    const autoIncrement = normalized.autoIncrement === undefined
      ? false
      : Boolean(normalized.autoIncrement);
    const defaultValue = resolveDefaultValue(
      normalized as Definition,
      type,
    );
    const runtimeType = type as FieldTypeLike;
    Object.defineProperties(this, {
      allowNull: { enumerable: true, value: Boolean(normalized.allowNull) },
      autoIncrement: { enumerable: true, value: autoIncrement },
      column: { enumerable: true, value: normalized.column || normalized.name },
      default: { enumerable: true, value: defaultValue },
      equal: {
        value: runtimeType.equal === undefined
          ? Type.$equal
          : runtimeType.equal.bind(runtimeType),
      },
      name: { enumerable: true, value: normalized.name },
      options: { value: normalized },
      primaryKey: { enumerable: true, value: Boolean(normalized.primaryKey) },
      type: { enumerable: true, value: type },
      validators: { enumerable: true, value: validators },
    });
  }

  /**
   * Compatibility getter for {@link default}.
   * @zh 兼容性 getter，返回 {@link default}。
   * @ja {@link default} を返す互換ゲッターです。
   */
  get defaultValue(): FieldDefinitionValue<Definition> | undefined {
    return this.default;
  }

  /**
   * Whether SQL adapters should quote the restored value.
   * @zh SQL Adapter 是否应给还原后的值加引号。
   * @ja SQL Adapter が `restore()` 後の値を引用符で囲む必要があるかどうかです。
   */
  get needQuotes(): boolean {
    return Boolean(this.type.needQuotes);
  }

  /**
   * Converts a storage value into its application representation.
   * @zh 把存储层值转换为应用层表示。
   * @ja ストレージ値をアプリケーション上の表現へ変換します。
   * @param value - Value returned by the storage backend.
   * @zh value - 存储后端返回的值。
   * @ja value - ストレージバックエンドが返した値です。
   * @returns Parsed application value.
   * @zh 解析后的应用层值。
   * @ja parse 後のアプリケーション値です。
   */
  parse(
    value: FieldDefinitionStorageValue<Definition>,
  ): FieldDefinitionValue<Definition> {
    return this.type.parse(value as never) as FieldDefinitionValue<Definition>;
  }

  /**
   * Converts an application value into its storage representation.
   * @zh 把应用层值转换为存储层表示。
   * @ja アプリケーション値をストレージ上の表現へ変換します。
   * @param value - Current Yukari field value.
   * @zh value - Yukari 字段的当前值。
   * @ja value - Yukari フィールドの現在値です。
   * @returns Value ready for the Adapter.
   * @zh 可以交给 Adapter 的值。
   * @ja Adapter へ渡せる状態の値です。
   */
  restore(
    value: FieldDefinitionValue<Definition>,
  ): FieldDefinitionStorageValue<Definition> {
    return this.type.restore(value as never) as FieldDefinitionStorageValue<Definition>;
  }

  /**
   * Compares two application values using the Field Type or strict equality.
   * @zh 使用 Field Type 或严格相等比较两个应用层值。
   * @ja Field Type または厳密等価を使用して、2 個のアプリケーション値を比較します。
   */
  declare readonly equal: (
    left: FieldDefinitionValue<Definition>,
    right: FieldDefinitionValue<Definition>,
  ) => boolean;

  /**
   * Converts an application value into its JSON representation.
   * @zh 把应用层值转换为 JSON 表示。
   * @ja アプリケーション値を JSON 上の表現へ変換します。
   * @param value - Application value to serialize.
   * @zh value - 要序列化的应用层值。
   * @ja value - シリアライズするアプリケーション値です。
   * @returns Field Type JSON value, or the input unchanged when no converter
   * is defined.
   * @zh Field Type 生成的 JSON 值；没有定义转换器时保持输入不变。
   * @ja Field Type が生成する JSON 値です。変換関数が定義されていない場合は入力値をそのまま返します。
   */
  toJSON(
    value: FieldDefinitionValue<Definition>,
  ): FieldDefinitionJsonValue<Definition> {
    const type = this.type as FieldTypeLike;
    if (type.toJSON === undefined) {
      return value as FieldDefinitionJsonValue<Definition>;
    }

    return type.toJSON(value as never) as FieldDefinitionJsonValue<Definition>;
  }
}

export function cloneValue<Value>(value: Value): Value {
  return cloneDeep(value);
}

function normalizeValidators<Value>(
  validators:
    | FieldValidator<Value>
    | readonly FieldValidator<Value>[]
    | undefined,
): readonly FieldValidator<Value>[] {
  if (validators === undefined) {
    return [];
  }

  if (typeof validators === 'function') return [validators];
  return Array.isArray(validators)
    ? validators as readonly FieldValidator<Value>[]
    : [];
}

function resolveDefaultValue<Definition extends SchemaFieldDefinition>(
  definition: Definition,
  type: FieldTypeFromDefinition<Definition>,
): FieldDefinitionValue<Definition> | undefined {
  if (definition.defaultValue !== undefined) {
    return definition.defaultValue as FieldDefinitionValue<Definition>;
  }

  return type.defaultValue as FieldDefinitionValue<Definition> | undefined;
}

function isRuntimeFieldType(type: FieldTypeLike | undefined): type is FieldTypeLike {
  return type !== undefined
    && typeof type.parse === 'function'
    && typeof type.restore === 'function';
}

function normalizeDefinition<Definition extends SchemaFieldDefinition>(
  definition: Definition,
): SchemaFieldDefinition {
  return otrans.toCamel(
    definition as Readonly<Record<string, unknown>>,
  ) as unknown as SchemaFieldDefinition;
}
