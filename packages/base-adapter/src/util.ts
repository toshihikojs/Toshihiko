const cloneDeep = require('lodash/cloneDeep') as <Value>(value: Value) => Value;

type UnknownRecord = Record<string, unknown>;

type Defined<Value> = Exclude<Value, undefined>;

type MergeDefined<DefaultValue, OptionValue> =
  DefaultValue extends object
    ? OptionValue extends object
      ? Merge<DefaultValue, OptionValue>
      : OptionValue
    : OptionValue;

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

/** Result type produced by {@link extend}, retaining required and optional keys. */
export type Merge<Defaults extends object, Options extends object> = {
  [Key in RequiredMergeKeys<Defaults, Options>]-?: MergeProperty<Defaults, Options, Key>;
} & {
  [Key in Exclude<MergeKeys<Defaults, Options>, RequiredMergeKeys<Defaults, Options>>]?:
    MergeProperty<Defaults, Options, Key>;
};

/**
 * Deeply copies Adapter options and fills missing properties from defaults.
 *
 * This intentionally preserves the v1 recursive merge order: at nested levels,
 * the existing option object becomes the recursive defaults argument. Code
 * which needs conventional deep-merge semantics should use a dedicated merge
 * utility instead.
 *
 * @param defaultOptions - Values used when the corresponding option is absent.
 * @param options - User-supplied values copied into the result.
 */
export function extend<
  Defaults extends object = object,
  Options extends object = object,
>(
  defaultOptions?: Defaults,
  options?: Options,
): Merge<Defaults, Options> {
  const defaults = (defaultOptions || {}) as UnknownRecord;
  const result = (cloneDeep(options) || {}) as UnknownRecord;

  for (const key in defaults) {
    if (!Object.prototype.hasOwnProperty.call(defaults, key)) continue;

    if (result[key] === undefined) {
      result[key] = cloneDeep(defaults[key]);
      continue;
    }

    if (typeof defaults[key] === 'object' && typeof result[key] === 'object') {
      result[key] = extend(
        result[key] as object,
        defaults[key] as object,
      );
    }
  }

  return result as Merge<Defaults, Options>;
}
