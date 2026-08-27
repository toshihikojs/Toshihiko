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

const StringType = {
  name: 'String',
  needQuotes: true,
  defaultValue: '',
  parse(value: unknown): string {
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
} satisfies FieldType<string, unknown>;

const BooleanType = {
  name: '_Boolean',
  needQuotes: false,
  defaultValue: 0 as unknown as boolean,
  parse(value: unknown): boolean {
    return Boolean(value);
  },
  restore(value: boolean): number {
    return ((value as unknown as number) ^ 0) & 1;
  },
  equal(left: boolean, right: boolean): boolean {
    return Boolean(left) === Boolean(right);
  },
} satisfies FieldType<boolean, unknown>;

const IntegerType = {
  name: 'Integer',
  needQuotes: false,
  defaultValue: 0,
  parse(value: unknown): number {
    return parseInt(value as string);
  },
  restore(value: number): number {
    return parseInt(value as unknown as string);
  },
  equal(left: number, right: number): boolean {
    if (left === right) return true;
    return parseInt(left as unknown as string) === parseInt(right as unknown as string);
  },
} satisfies FieldType<number, unknown>;

const FloatType = {
  name: 'Float',
  needQuotes: false,
  defaultValue: 0,
  parse(value: unknown): number {
    return parseFloat(value as string);
  },
  restore(value: number): number {
    return parseFloat(value as unknown as string);
  },
  equal(left: number, right: number): boolean {
    if (left === right) return true;
    return parseFloat(left as unknown as string) === parseFloat(right as unknown as string);
  },
} satisfies FieldType<number, unknown>;

const JsonType = {
  name: 'Json',
  needQuotes: true,
  defaultValue: {} as JsonValue,
  parse(value: unknown): JsonValue {
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
} satisfies FieldType<JsonValue, unknown, JsonValue>;

const DatetimeType = {
  name: 'Datetime',
  needQuotes: true,
  parse(value: unknown): Date {
    return moment(value as moment.MomentInput).toDate();
  },
  restore(value: Date): string {
    return moment(value).format('YYYY-MM-DD HH:mm:ss');
  },
  equal(left: Date, right: Date): boolean {
    return moment(left).format('x') === moment(right).format('x');
  },
  toJSON(value: Date): string {
    if ((value as Date | null) === null) return null as unknown as string;
    const datetime = value instanceof Date
      ? value
      : moment(value as moment.MomentInput).toDate();
    return moment(datetime).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
  },
} satisfies FieldType<Date, unknown, string>;

export const Type = {
  Boolean: BooleanType,
  Datetime: DatetimeType,
  Float: FloatType,
  Integer: IntegerType,
  Json: JsonType,
  String: StringType,
  $equal(left: unknown, right: unknown): boolean {
    return left === right;
  },
};
