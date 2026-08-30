/** Minimum object constraint used by schema-aware row helpers. */
export type RowShape = object;

/** Extracts string field names from a row object. */
export type FieldName<Row extends RowShape> = Extract<keyof Row, string>;

/** A value that can be stored in a model field or returned by an adapter. */
export type DataValue =
  | object
  | string
  | number
  | bigint
  | boolean
  | symbol
  | null
  | undefined;

/** A row whose field names are not known until a schema or driver supplies them. */
export type DataRow = Readonly<Record<string, DataValue>>;
