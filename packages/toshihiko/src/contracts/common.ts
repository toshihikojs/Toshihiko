export type RowShape = object;

export type FieldName<Row extends RowShape> = Extract<keyof Row, string>;
