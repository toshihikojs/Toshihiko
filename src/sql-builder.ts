import { sqlNameToColumn } from '@toshihiko/sql-utils';
import { format as mysqlFormat } from 'mysql2';
import type {
  MySQLField,
  MySQLModel,
  MySQLQueryOptions,
  MySQLStatement,
} from './contracts';

type SqlOperation = string;
type SqlLogic = 'AND' | 'OR';

const fieldOperators = Object.freeze({
  '$between': 'BETWEEN',
  '$eq': '=',
  '$gt': '>',
  '$gte': '>=',
  '$in': 'IN',
  '$like': 'LIKE',
  '$lt': '<',
  '$lte': '<=',
  '$neq': '!=',
  '<': '<',
  '<=': '<=',
  '===': '=',
  '>': '>',
  '>=': '>=',
  '!==': '!=',
} as const);

type FieldOperator = keyof typeof fieldOperators;

export class MySQLSqlBuilder {
  compileFieldWhere(
    model: MySQLModel,
    key: string,
    condition: unknown,
    logic: string = 'AND',
  ): MySQLStatement {
    const normalizedLogic = normalizeLogic(logic);
    const field = getField(model, key);

    if (condition === null) {
      return statement(`${quoteIdentifier(field.column)} IS NULL`);
    }

    if (!isRecord(condition) || condition instanceof Date || Array.isArray(condition)) {
      return this.compileEquality(field, condition);
    }

    const fragments: MySQLStatement[] = [];
    let recognized = true;

    for (const [rawOperator, operand] of Object.entries(condition)) {
      const operator = rawOperator.toLowerCase();
      if (operator === '$and' || operator === '$or') {
        const nestedLogic = operator === '$and' ? 'AND' : 'OR';
        const values = Array.isArray(operand) ? operand : [operand];
        const nested = values.map((value) => this.compileFieldWhere(
          model,
          key,
          value,
          nestedLogic,
        ));
        fragments.push(groupStatements(nested, nestedLogic));
        continue;
      }

      if (!isFieldOperator(operator)) {
        recognized = false;
        break;
      }

      fragments.push(this.compileOperator(field, operator, operand));
    }

    if (recognized && fragments.length > 0) {
      return groupStatements(fragments, normalizedLogic);
    }

    return this.compileEquality(field, condition);
  }

  makeFieldWhere(
    model: MySQLModel,
    key: string,
    condition: unknown,
    logic: string = 'AND',
  ): string {
    return formatStatement(this.compileFieldWhere(model, key, condition, logic));
  }

  compileArrayWhere(
    model: MySQLModel,
    condition: readonly Readonly<Record<string, unknown>>[],
    logic: string = 'AND',
  ): MySQLStatement {
    if (!Array.isArray(condition)) {
      throw new TypeError('Non-array condition.');
    }

    const normalizedLogic = normalizeLogic(logic);
    return groupStatements(
      condition.map((entry) => this.compileWhere(model, entry, 'AND')),
      normalizedLogic,
      true,
    );
  }

  makeArrayWhere(
    model: MySQLModel,
    condition: readonly Readonly<Record<string, unknown>>[],
    logic: string = 'AND',
  ): string {
    return formatStatement(this.compileArrayWhere(model, condition, logic));
  }

  compileWhere(
    model: MySQLModel,
    condition: Readonly<Record<string, unknown>> | readonly Readonly<Record<string, unknown>>[],
    logic: string = 'AND',
  ): MySQLStatement {
    const normalizedLogic = normalizeLogic(logic);
    if (Array.isArray(condition)) {
      return this.compileArrayWhere(model, condition, normalizedLogic);
    }
    if (!isRecord(condition)) {
      throw new TypeError('SQL condition must be an object or array.');
    }

    const fragments: MySQLStatement[] = [];
    for (const [key, value] of Object.entries(condition)) {
      if (key === '$and' || key === '$or') {
        const nestedLogic = key === '$and' ? 'AND' : 'OR';
        if (Array.isArray(value)) {
          fragments.push(this.compileArrayWhere(
            model,
            value.map(assertConditionRecord),
            nestedLogic,
          ));
        } else {
          fragments.push(this.compileWhere(
            model,
            assertConditionRecord(value),
            nestedLogic,
          ));
        }
        continue;
      }

      fragments.push(this.compileFieldWhere(model, key, value, normalizedLogic));
    }

    return groupStatements(fragments, normalizedLogic, true);
  }

  makeWhere(
    model: MySQLModel,
    condition: Readonly<Record<string, unknown>> | readonly Readonly<Record<string, unknown>>[],
    logic: string = 'AND',
  ): string {
    return formatStatement(this.compileWhere(model, condition, logic));
  }

  makeOrder(
    model: MySQLModel,
    order: readonly Readonly<Record<string, 1 | -1>>[],
  ): string {
    const fragments: string[] = [];
    for (const entry of order) {
      const key = Object.keys(entry)[0];
      if (key === undefined) {
        continue;
      }
      const field = getField(model, key);
      fragments.push(`${quoteIdentifier(field.column)} ${entry[key] === 1 ? 'ASC' : 'DESC'}`);
    }
    return fragments.join(', ');
  }

  makeLimit(
    _model: MySQLModel,
    limit: readonly (number | string)[],
  ): string {
    return limit.map(normalizeLimit).join(', ');
  }

  makeIndex(_model: MySQLModel, index?: string): string {
    return index ? `FORCE INDEX(${quoteIdentifier(index)})` : '';
  }

  makeSet(
    model: MySQLModel,
    update: Readonly<Record<string, unknown>>,
  ): string {
    return formatStatement(this.compileSet(model, update));
  }

  compileSet(
    model: MySQLModel,
    update: Readonly<Record<string, unknown>>,
  ): MySQLStatement {
    const assignments: MySQLStatement[] = [];
    for (const [key, value] of Object.entries(update)) {
      const field = model.fieldNamesMap[key];
      if (field === undefined) {
        continue;
      }

      const setValue = this.compileSetValue(model, field, value);
      assignments.push({
        sql: `${quoteIdentifier(field.column)} = ${setValue.sql}`,
        values: setValue.values,
      });
    }
    return joinStatements(assignments, ', ');
  }

  makeFind(model: MySQLModel, options: MySQLQueryOptions = {}): string {
    return formatStatement(this.compileFind(model, options));
  }

  compileFind(model: MySQLModel, options: MySQLQueryOptions = {}): MySQLStatement {
    const fields = options.fields?.length ? options.fields : undefined;
    const selected = options.count
      ? 'COUNT(0)'
      : fields === undefined
        ? '*'
        : fields.map((name) => {
          const column = model.nameToColumn[name];
          if (column === undefined) {
            throw new Error(`no field named "${name}" in model "${model.name}"`);
          }
          return quoteIdentifier(column);
        }).join(', ');

    let result = statement(`SELECT ${selected} FROM ${quoteIdentifier(model.name)}`);
    const index = this.makeIndex(model, options.index);
    if (index) {
      result = appendStatement(result, statement(` ${index}`));
    }
    result = appendStatement(result, this.compileWhereClause(model, options.where));
    result = appendStatement(result, statement(this.makeOrderClause(model, options.order)));
    result = appendStatement(result, statement(this.makeLimitClause(model, options.limit)));
    return result;
  }

  makeUpdate(model: MySQLModel, options: MySQLQueryOptions = {}): string {
    return formatStatement(this.compileUpdate(model, options));
  }

  compileUpdate(model: MySQLModel, options: MySQLQueryOptions = {}): MySQLStatement {
    const set = this.compileSet(model, options.update ?? {});
    if (!set.sql) {
      throw new Error('no set data.');
    }

    let result = statement(`UPDATE ${quoteIdentifier(model.name)}`);
    const index = this.makeIndex(model, options.index);
    if (index) {
      result = appendStatement(result, statement(` ${index}`));
    }
    result = appendStatement(result, {
      sql: ` SET ${set.sql}`,
      values: set.values,
    });
    result = appendStatement(result, this.compileWhereClause(model, options.where));
    result = appendStatement(result, statement(this.makeOrderClause(model, options.order)));
    result = appendStatement(result, statement(this.makeLimitClause(model, options.limit)));
    return result;
  }

  makeDelete(model: MySQLModel, options: MySQLQueryOptions = {}): string {
    return formatStatement(this.compileDelete(model, options));
  }

  compileDelete(model: MySQLModel, options: MySQLQueryOptions = {}): MySQLStatement {
    let result = statement(`DELETE FROM ${quoteIdentifier(model.name)}`);
    result = appendStatement(result, this.compileWhereClause(model, options.where));
    result = appendStatement(result, statement(this.makeOrderClause(model, options.order)));

    const limit = options.limit;
    if (limit !== undefined && limit.length > 0) {
      if (limit.length === 1) {
        result = appendStatement(result, statement(` LIMIT ${normalizeLimit(limit[0])}`));
      } else if (limit[0] === 0) {
        result = appendStatement(result, statement(` LIMIT ${normalizeLimit(limit[1])}`));
      } else {
        throw new Error('MySQL DELETE supports a row count but not a non-zero offset.');
      }
    }
    return result;
  }

  makeSql(
    type: SqlOperation,
    model: MySQLModel,
    options: MySQLQueryOptions = {},
  ): string {
    return formatStatement(this.compileSql(type, model, options));
  }

  compileSql(
    type: SqlOperation,
    model: MySQLModel,
    options: MySQLQueryOptions = {},
  ): MySQLStatement {
    switch (type) {
      case 'count':
        return this.compileFind(model, { ...options, count: true });
      case 'delete':
        return this.compileDelete(model, options);
      case 'update':
        return this.compileUpdate(model, options);
      case 'find':
        return this.compileFind(model, options);
      default:
        return this.compileFind(model, options);
    }
  }

  private compileOperator(
    field: MySQLField,
    operator: FieldOperator,
    operand: unknown,
  ): MySQLStatement {
    const symbol = fieldOperators[operator];
    const column = quoteIdentifier(field.column);

    if (symbol === 'IN') {
      if (!Array.isArray(operand) || operand.length === 0) {
        throw new TypeError('$in requires a non-empty array.');
      }
      const values = operand.map((value) => this.restore(field, value));
      return {
        sql: `${column} IN (${values.map(() => '?').join(', ')})`,
        values,
      };
    }

    if (symbol === 'BETWEEN') {
      if (!Array.isArray(operand) || operand.length !== 2) {
        throw new TypeError('$between requires exactly two values.');
      }
      return {
        sql: `${column} BETWEEN ? AND ?`,
        values: [this.restore(field, operand[0]), this.restore(field, operand[1])],
      };
    }

    const logicalValues = splitLogicalValues(operand);
    const andFragments = logicalValues.and.map((value) => this.compileComparison(
      field,
      symbol,
      value,
    ));
    const orFragments = logicalValues.or.map((value) => this.compileComparison(
      field,
      symbol,
      value,
    ));
    const andSql = groupStatements(andFragments, 'AND');
    const orSql = groupStatements(orFragments, 'OR');

    if (andSql.sql && orSql.sql) {
      return groupStatements([andSql, orSql], 'AND', true);
    }
    return andSql.sql ? andSql : orSql;
  }

  private compileComparison(
    field: MySQLField,
    symbol: string,
    value: unknown,
  ): MySQLStatement {
    const column = quoteIdentifier(field.column);
    if ((symbol === '=' || symbol === '!=') && value === null) {
      return statement(`${column} IS ${symbol === '=' ? 'NULL' : 'NOT NULL'}`);
    }
    return { sql: `${column} ${symbol} ?`, values: [this.restore(field, value)] };
  }

  private compileEquality(field: MySQLField, value: unknown): MySQLStatement {
    if (value === null) {
      return statement(`${quoteIdentifier(field.column)} IS NULL`);
    }
    return {
      sql: `${quoteIdentifier(field.column)} = ?`,
      values: [this.restore(field, value)],
    };
  }

  private compileSetValue(
    model: MySQLModel,
    field: MySQLField,
    value: unknown,
  ): MySQLStatement {
    if (value === null) {
      if (!field.allowNull) {
        throw new TypeError(`field "${field.name}" does not allow null.`);
      }
      return statement('NULL');
    }

    if (isRawExpression(value)) {
      return statement(sqlNameToColumn(value.slice(2, -2), completeNameToColumn(model)));
    }
    return { sql: '?', values: [this.restore(field, value)] };
  }

  private restore(field: MySQLField, value: unknown): unknown {
    return field.restore(value);
  }

  private compileWhereClause(
    model: MySQLModel,
    where?: Readonly<Record<string, unknown>>,
  ): MySQLStatement {
    if (where === undefined || Object.keys(where).length === 0) {
      return statement('');
    }
    const compiled = this.compileWhere(model, where);
    return { sql: ` WHERE ${compiled.sql}`, values: compiled.values };
  }

  private makeOrderClause(
    model: MySQLModel,
    order?: readonly Readonly<Record<string, 1 | -1>>[],
  ): string {
    if (order === undefined || order.length === 0) {
      return '';
    }
    const sql = this.makeOrder(model, order);
    return sql ? ` ORDER BY ${sql}` : '';
  }

  private makeLimitClause(model: MySQLModel, limit?: readonly number[]): string {
    if (limit === undefined || limit.length === 0) {
      return '';
    }
    return ` LIMIT ${this.makeLimit(model, limit)}`;
  }
}

function getField(model: MySQLModel, name: string): MySQLField {
  const field = model.fieldNamesMap[name];
  if (field === undefined) {
    throw new Error(`no field named "${name}" in model "${model.name}"`);
  }
  return field;
}

function statement(sql: string): MySQLStatement {
  return { sql, values: [] };
}

function appendStatement(
  left: MySQLStatement,
  right: MySQLStatement,
): MySQLStatement {
  return {
    sql: left.sql + right.sql,
    values: [...left.values, ...right.values],
  };
}

function joinStatements(
  fragments: readonly MySQLStatement[],
  separator: string,
): MySQLStatement {
  return {
    sql: fragments.map((fragment) => fragment.sql).join(separator),
    values: fragments.flatMap((fragment) => fragment.values),
  };
}

function groupStatements(
  fragments: readonly MySQLStatement[],
  logic: SqlLogic,
  forceGroup: boolean = false,
): MySQLStatement {
  const joined = joinStatements(
    fragments.filter((fragment) => Boolean(fragment.sql)),
    ` ${logic} `,
  );
  return forceGroup || fragments.length > 1
    ? { sql: `(${joined.sql})`, values: joined.values }
    : joined;
}

function formatStatement(compiled: MySQLStatement): string {
  return mysqlFormat(compiled.sql, [...compiled.values] as never[]);
}

function quoteIdentifier(identifier: string): string {
  return `\`${identifier.replaceAll('`', '``')}\``;
}

function normalizeLogic(logic: string): SqlLogic {
  return logic.toUpperCase() === 'OR' ? 'OR' : 'AND';
}

function normalizeLimit(value: number | string | undefined): number {
  const normalized = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(normalized)) {
    return 0;
  }
  return Math.max(0, normalized);
}

function splitLogicalValues(value: unknown): {
  readonly and: readonly unknown[];
  readonly or: readonly unknown[];
} {
  if (isRecord(value) && ('$and' in value || '$or' in value)) {
    return {
      and: toArray(value.$and),
      or: toArray(value.$or),
    };
  }
  return { and: toArray(value), or: [] };
}

function toArray(value: unknown): readonly unknown[] {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function isFieldOperator(value: string): value is FieldOperator {
  return Object.prototype.hasOwnProperty.call(fieldOperators, value);
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertConditionRecord(value: unknown): Readonly<Record<string, unknown>> {
  if (!isRecord(value)) {
    throw new TypeError('nested SQL condition must be an object.');
  }
  return value;
}

function isRawExpression(value: unknown): value is string {
  return typeof value === 'string'
    && value.length >= 4
    && value.startsWith('{{')
    && value.endsWith('}}');
}

function completeNameToColumn(model: MySQLModel): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, column] of Object.entries(model.nameToColumn)) {
    if (column !== undefined) {
      result[name] = column;
    }
  }
  return result;
}
