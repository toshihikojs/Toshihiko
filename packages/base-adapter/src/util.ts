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

/**
 * Result type produced by {@link extend}, retaining required and optional keys.
 * @zh {@link extend} 生成的结果类型，会保留必填键和可选键。
 * @ja {@link extend} が生成する結果型です。必須キーと任意キーを維持します。
 */
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
 * @zh 深拷贝 Adapter 选项，并用默认值补齐缺失属性。
 *
 * 这里有意保留 v1 的递归合并顺序：在嵌套层级中，已有选项对象会成为递归调用的 defaults 参数。需要常规深合并语义的代码应使用专门的合并工具。
 * @ja Adapter のオプションをディープコピーし、欠けているプロパティを既定値で補います。
 *
 * ここでは v1 の再帰的なマージ順序を意図的に維持しています。ネストした階層では、既存のオプションオブジェクトが再帰呼び出しの defaults 引数になります。一般的なディープマージの挙動が必要なコードでは、専用のマージユーティリティを使用してください。
 * @param defaultOptions - Values used when the corresponding option is absent.
 * @zh defaultOptions - 对应选项缺失时使用的值。
 * @ja defaultOptions - 対応するオプションが指定されていない場合に使用する値です。
 * @param options - User-supplied values copied into the result.
 * @zh options - 复制到结果中的用户输入值。
 * @ja options - 結果へコピーするユーザー指定の値です。
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
