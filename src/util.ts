type UnknownRecord = Record<string, unknown>;

const unsafeKeys = new Set(['__proto__', 'constructor', 'prototype']);

export function extend<
  Defaults extends object = UnknownRecord,
  Options extends object = UnknownRecord,
>(
  defaultOptions?: Defaults,
  options?: Options,
): Defaults & Options {
  return mergeRecords(
    toRecord(defaultOptions),
    toRecord(options),
  ) as Defaults & Options;
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

  const result: UnknownRecord = {};
  for (const key of Object.keys(value)) {
    if (!unsafeKeys.has(key)) {
      result[key] = (value as UnknownRecord)[key];
    }
  }
  return result;
}
