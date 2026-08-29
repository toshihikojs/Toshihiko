import fbbkJson = require('fbbk-json');
import moment = require('moment');
import type { FieldType } from './contracts/field';

export type JsonValue =
  | boolean
  | null
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type StringStorageValue = string | number | bigint | boolean | null | undefined;
export type BooleanStorageValue = string | number | boolean | null | undefined;
export type NumberStorageValue = string | number;
export type JsonStorageValue = string | JsonValue;
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

export const Type = {
  Boolean: BooleanType,
  Datetime: DatetimeType,
  Float: FloatType,
  Integer: IntegerType,
  Json: JsonType,
  String: StringType,
  $equal<Value>(left: Value, right: Value): boolean {
    return left === right;
  },
};
