/**
 * Minimum object constraint used by schema-aware row helpers.
 * @zh 能够感知 schema 的数据行辅助类型使用的最小对象约束。
 * @ja schema を認識するデータ行ヘルパーが使用する、最小限のオブジェクト制約です。
 */
export type RowShape = object;

/**
 * Extracts string field names from a row object.
 * @zh 从数据行对象提取字符串字段名。
 * @ja データ行オブジェクトから文字列のフィールド名を抽出します。
 */
export type FieldName<Row extends RowShape> = Extract<keyof Row, string>;

/**
 * A value that can be stored in a model field or returned by an adapter.
 * @zh 可以存入 Model 字段或由 Adapter 返回的值。
 * @ja Model のフィールドに保存できる値、または Adapter が返せる値です。
 */
export type DataValue =
  | object
  | string
  | number
  | bigint
  | boolean
  | symbol
  | null
  | undefined;

/**
 * A row whose field names are not known until a schema or driver supplies them.
 * @zh 字段名要到 schema 或驱动提供后才能确定的数据行。
 * @ja schema またはドライバーによって指定されるまでフィールド名が確定しないデータ行です。
 */
export type DataRow = Readonly<Record<string, DataValue>>;
