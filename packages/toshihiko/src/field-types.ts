import fbbkJson = require('fbbk-json');
import moment = require('moment');
import type { FieldType } from './contracts/field';

/**
 * A recursively serializable JSON value.
 * @zh 可递归序列化的 JSON 值。
 * @ja 再帰的にシリアライズできる JSON 値です。
 */
export type JsonValue =
  | boolean
  | null
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

/**
 * Storage values accepted by `Type.String.parse()`.
 * @zh 以下方法接受的存储层值：`Type.String.parse()`。
 * @ja `Type.String.parse()` が受け付けるストレージ値です。
 */
export type StringStorageValue = string | number | bigint | boolean | null | undefined;
/**
 * Storage values accepted by `Type.Boolean.parse()`.
 * @zh 以下方法接受的存储层值：`Type.Boolean.parse()`。
 * @ja `Type.Boolean.parse()` が受け付けるストレージ値です。
 */
export type BooleanStorageValue = string | number | boolean | null | undefined;
/**
 * Storage values accepted by numeric Field Types.
 * @zh 数值 Field Type 接受的存储层值。
 * @ja 数値 Field Type が受け付けるストレージ値です。
 */
export type NumberStorageValue = string | number;
/**
 * Storage values accepted by `Type.Json.parse()`.
 * @zh 以下方法接受的存储层值：`Type.Json.parse()`。
 * @ja `Type.Json.parse()` が受け付けるストレージ値です。
 */
export type JsonStorageValue = string | JsonValue;
/**
 * Storage values accepted by `Type.Datetime.parse()`.
 * @zh 以下方法接受的存储层值：`Type.Datetime.parse()`。
 * @ja `Type.Datetime.parse()` が受け付けるストレージ値です。
 */
export type DatetimeStorageValue = moment.MomentInput;

const StringType = {
  name: 'String',
  needQuotes: true,
  defaultValue: '',
  parse(value: StringStorageValue): string {
    return value === null || value === undefined ? '' : String(value);
  },
  restore(value: string): string {
    return value === null || value === undefined ? '' : String(value);
  },
  equal(left: string, right: string): boolean {
    if (left === right) return true;
    try {
      return left.toString() === right.toString();
    } catch {
      return false;
    }
  },
} satisfies FieldType<string, StringStorageValue>;

const BooleanType = {
  name: '_Boolean',
  needQuotes: false,
  defaultValue: 0 as never as boolean,
  parse(value: BooleanStorageValue): boolean {
    return Boolean(value);
  },
  restore(value: boolean): number {
    return (Number(value) ^ 0) & 1;
  },
  equal(left: boolean, right: boolean): boolean {
    return Boolean(left) === Boolean(right);
  },
} satisfies FieldType<boolean, BooleanStorageValue, boolean>;

const IntegerType = {
  name: 'Integer',
  needQuotes: false,
  defaultValue: 0,
  parse(value: NumberStorageValue): number {
    return parseInt(value as string);
  },
  restore(value: number): number {
    return parseInt(String(value));
  },
  equal(left: number, right: number): boolean {
    if (left === right) return true;
    return parseInt(String(left)) === parseInt(String(right));
  },
} satisfies FieldType<number, NumberStorageValue>;

const FloatType = {
  name: 'Float',
  needQuotes: false,
  defaultValue: 0,
  parse(value: NumberStorageValue): number {
    return parseFloat(value as string);
  },
  restore(value: number): number {
    return parseFloat(String(value));
  },
  equal(left: number, right: number): boolean {
    if (left === right) return true;
    return parseFloat(String(left)) === parseFloat(String(right));
  },
} satisfies FieldType<number, NumberStorageValue>;

const JsonType = {
  name: 'Json',
  needQuotes: true,
  defaultValue: {} as JsonValue,
  parse(value: JsonStorageValue): JsonValue {
    try {
      return fbbkJson.parse(value) as JsonValue;
    } catch {
      if (process.env.NODE_ENV !== 'test') {
        console.error(
          `Toshihiko: Broken json value while parsing JSON type in Toshihiko: ${String(value)}`,
        );
      }
      return {};
    }
  },
  restore(value: JsonValue): string {
    return JSON.stringify(value);
  },
  equal(left: JsonValue, right: JsonValue): boolean {
    if (left === right) return true;
    try {
      return JSON.stringify(left) === JSON.stringify(right);
    } catch {
      return false;
    }
  },
} satisfies FieldType<JsonValue, JsonStorageValue, JsonValue>;

const DatetimeType = {
  name: 'Datetime',
  needQuotes: true,
  parse(value: DatetimeStorageValue): Date {
    return moment(value as moment.MomentInput).toDate();
  },
  restore(value: Date): string {
    return moment(value).format('YYYY-MM-DD HH:mm:ss');
  },
  equal(left: Date, right: Date): boolean {
    return moment(left).format('x') === moment(right).format('x');
  },
  toJSON(value: Date): string {
    if ((value as Date | null) === null) return null as never as string;
    const datetime = value instanceof Date
      ? value
      : moment(value as moment.MomentInput).toDate();
    return moment(datetime).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
  },
} satisfies FieldType<Date, DatetimeStorageValue, string>;

/**
 * Built-in Field Types used by schema definitions.
 * @zh schema 定义使用的内置 Field Type。
 * @ja schema 定義で使用する組み込み Field Type です。
 * @category Schema and fields
 * @zh Schema 与字段
 * @ja Schema とフィールド
 */
export const Type = {
  /**
   * Converts storage truthiness to `boolean` and restores it as `0` or `1`.
   * @zh 把存储层真值转换为 `boolean`，并还原为 `0` 或 `1`。
   * @ja ストレージ値の真偽を `boolean` へ変換し、`0` または `1` としてストレージ表現へ戻します。
   */
  Boolean: BooleanType,
  /**
   * Converts supported date inputs to `Date` and restores SQL datetime text.
   * @zh 把支持的日期输入转换为 `Date`，并还原为 SQL datetime 文本。
   * @ja 対応する日付入力を `Date` へ変換し、SQL の日時文字列としてストレージ表現へ戻します。
   */
  Datetime: DatetimeType,
  /**
   * Converts storage values with `parseFloat()`.
   * @zh 使用 `parseFloat()` 转换存储层值。
   * @ja `parseFloat()` を使用してストレージ値を変換します。
   */
  Float: FloatType,
  /**
   * Converts storage values with `parseInt()`.
   * @zh 使用 `parseInt()` 转换存储层值。
   * @ja `parseInt()` を使用してストレージ値を変換します。
   */
  Integer: IntegerType,
  /**
   * Parses JSON-compatible input and restores JSON text.
   * @zh 解析兼容 JSON 的输入，并还原为 JSON 文本。
   * @ja JSON 互換の入力を解析し、JSON 文字列としてストレージ表現へ戻します。
   */
  Json: JsonType,
  /**
   * Converts storage values to strings.
   * @zh 把存储层值转换为字符串。
   * @ja ストレージ値を文字列へ変換します。
   */
  String: StringType,
  /**
   * Default strict-equality comparator retained for v1 runtime compatibility.
   *
   * @internal
   */
  $equal<Value>(left: Value, right: Value): boolean {
    return left === right;
  },
};
