type UnknownRecord = Record<string, unknown>;

type Defined<Value> = Exclude<Value, undefined>;

type MergeDefined<DefaultValue, OptionValue> =
  DefaultValue extends object
    ? DefaultValue extends BuiltInObject ? OptionValue
      : OptionValue extends object
        ? OptionValue extends BuiltInObject ? OptionValue
          : Merge<DefaultValue, OptionValue>
        : OptionValue
    : OptionValue;

type BuiltInObject =
  | Date
  | RegExp
  | readonly unknown[]
  | ((...arguments_: readonly never[]) => unknown)
  | ReadonlyMap<unknown, unknown>
  | ReadonlySet<unknown>;

type MergeValue<DefaultValue, OptionValue> =
  undefined extends OptionValue
    ? DefaultValue | MergeDefined<DefaultValue, Defined<OptionValue>>
    : MergeDefined<DefaultValue, OptionValue>;

type RequiredKeys<Value extends object> = {
  [Key in keyof Value]-?: {} extends Pick<Value, Key> ? never : Key;
}[keyof Value];

type MergeKeys<Defaults extends object, Options extends object> =
  keyof Defaults | keyof Options;

type MergeProperty<Defaults extends object, Options extends object, Key> =
  Key extends keyof Options
    ? Key extends keyof Defaults
      ? MergeValue<Defaults[Key], Options[Key]>
      : Options[Key]
    : Key extends keyof Defaults ? Defaults[Key] : never;

type RequiredMergeKeys<Defaults extends object, Options extends object> = Extract<
  RequiredKeys<Defaults> | RequiredKeys<Options>,
  MergeKeys<Defaults, Options>
>;

export type Merge<Defaults extends object, Options extends object> = {
  [Key in RequiredMergeKeys<Defaults, Options>]-?: MergeProperty<Defaults, Options, Key>;
} & {
  [Key in Exclude<MergeKeys<Defaults, Options>, RequiredMergeKeys<Defaults, Options>>]?:
    MergeProperty<Defaults, Options, Key>;
};

const unsafeKeys = new Set(['__proto__', 'constructor', 'prototype']);

export function extend<
  Defaults extends object = UnknownRecord,
  Options extends object = UnknownRecord,
>(
  defaultOptions?: Defaults,
  options?: Options,
): Merge<Defaults, Options> {
  return mergeRecords(
    toRecord(defaultOptions),
    toRecord(options),
  ) as Merge<Defaults, Options>;
}

function mergeRecords(defaults: UnknownRecord, options: UnknownRecord): UnknownRecord {
  const result = cloneRecord(options);

  for (const [key, defaultValue] of Object.entries(defaults)) {
    if (unsafeKeys.has(key)) {
      continue;
    }

    const optionValue = result[key];
    if (optionValue === undefined) {
      result[key] = cloneValue(defaultValue);
      continue;
    }

    if (isPlainRecord(defaultValue) && isPlainRecord(optionValue)) {
      result[key] = mergeRecords(defaultValue, optionValue);
    }
  }

  return result;
}

function cloneRecord(value: UnknownRecord): UnknownRecord {
  const result: UnknownRecord = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!unsafeKeys.has(key)) {
      result[key] = cloneValue(entry);
    }
  }
  return result;
}

function cloneValue<Value>(value: Value): Value {
  if (Array.isArray(value)) {
    return value.map(cloneValue) as Value;
  }
  if (value instanceof Date) {
    return new Date(value.getTime()) as Value;
  }
  if (isPlainRecord(value)) {
    return cloneRecord(value) as Value;
  }
  return value;
}

function isPlainRecord(value: unknown): value is UnknownRecord {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const prototype = Object.getPrototypeOf(value) as unknown;
  return prototype === Object.prototype || prototype === null;
}

function toRecord(value: object | undefined): UnknownRecord {
  if (value === undefined) {
    return {};
  }

  if (!isPlainRecord(value)) {
    throw new TypeError('extend() options must be plain objects.');
  }

  return value;
}
