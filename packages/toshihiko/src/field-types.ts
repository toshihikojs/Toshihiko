import type { FieldType } from './contracts/field';

export type JsonValue =
  | boolean
  | null
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

const StringType = Object.freeze({
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
    return left === right;
  },
}) satisfies FieldType<string, unknown>;

const BooleanType = Object.freeze({
  name: 'Boolean',
  needQuotes: false,
  defaultValue: false,
  parse(value: unknown): boolean {
    return Boolean(value);
  },
  restore(value: boolean): number {
    return value ? 1 : 0;
  },
  equal(left: boolean, right: boolean): boolean {
    return left === right;
  },
}) satisfies FieldType<boolean, unknown>;

const IntegerType = Object.freeze({
  name: 'Integer',
  needQuotes: false,
  defaultValue: 0,
  parse(value: unknown): number {
    return Number.parseInt(String(value), 10);
  },
  restore(value: number): number {
    return Math.trunc(value);
  },
  equal(left: number, right: number): boolean {
    return left === right;
  },
}) satisfies FieldType<number, unknown>;

const FloatType = Object.freeze({
  name: 'Float',
  needQuotes: false,
  defaultValue: 0,
  parse(value: unknown): number {
    return Number.parseFloat(String(value));
  },
  restore(value: number): number {
    return Number.parseFloat(String(value));
  },
  equal(left: number, right: number): boolean {
    return left === right;
  },
}) satisfies FieldType<number, unknown>;

const JsonType = Object.freeze({
  name: 'Json',
  needQuotes: true,
  defaultValue: Object.freeze({}) as JsonValue,
  parse(value: unknown): JsonValue {
    if (typeof value === 'string') {
      return JSON.parse(value) as JsonValue;
    }
    return value as JsonValue;
  },
  restore(value: JsonValue): string {
    return JSON.stringify(value);
  },
  clone(value: JsonValue): JsonValue {
    return structuredClone(value);
  },
  equal(left: JsonValue, right: JsonValue): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
  },
}) satisfies FieldType<JsonValue, unknown, JsonValue>;

const DatetimeType = Object.freeze({
  name: 'Datetime',
  needQuotes: true,
  parse(value: unknown): Date {
    return value instanceof Date ? new Date(value.getTime()) : new Date(String(value));
  },
  restore(value: Date): string {
    return formatDateTime(value);
  },
  clone(value: Date): Date {
    return new Date(value.getTime());
  },
  equal(left: Date, right: Date): boolean {
    return left.getTime() === right.getTime();
  },
  toJSON(value: Date): string {
    return value.toISOString();
  },
}) satisfies FieldType<Date, unknown, string>;

function formatDateTime(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hour = String(value.getHours()).padStart(2, '0');
  const minute = String(value.getMinutes()).padStart(2, '0');
  const second = String(value.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export const Type = Object.freeze({
  Boolean: BooleanType,
  Datetime: DatetimeType,
  Float: FloatType,
  Integer: IntegerType,
  Json: JsonType,
  String: StringType,
});
