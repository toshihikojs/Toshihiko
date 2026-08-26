import { sqlNameToColumn } from '@toshihiko/sql-utils';
import { format as mysqlFormat } from 'mysql2';
import type {
  MySQLField,
  MySQLModel,
  MySQLQueryOptions,
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
  makeFieldWhere(
    model: MySQLModel,
    key: string,
    condition: unknown,
    logic: string = 'AND',
  ): string {
    const normalizedLogic = normalizeLogic(logic);
    const field = getField(model, key);

    if (condition === null) {
      return `${quoteIdentifier(field.column)} IS NULL`;
    }

    if (!isRecord(condition) || condition instanceof Date || Array.isArray(condition)) {
      return this.makeEquality(field, condition);
    }

    const fragments: string[] = [];
    let recognized = true;

    for (const [rawOperator, operand] of Object.entries(condition)) {
      const operator = rawOperator.toLowerCase();
      if (operator === '$and' || operator === '$or') {
        const nestedLogic = operator === '$and' ? 'AND' : 'OR';
        const values = Array.isArray(operand) ? operand : [operand];
        const nested = values.map((value) => this.makeFieldWhere(
          model,
          key,
          value,
          nestedLogic,
        ));
        fragments.push(groupFragments(nested, nestedLogic));
        continue;
      }

      if (!isFieldOperator(operator)) {
        recognized = false;
        break;
      }

      fragments.push(this.makeOperator(field, operator, operand));
    }

    if (recognized && fragments.length > 0) {
      return groupFragments(fragments, normalizedLogic);
    }

    return this.makeEquality(field, condition);
  }

  makeArrayWhere(
    model: MySQLModel,
    condition: readonly Readonly<Record<string, unknown>>[],
    logic: string = 'AND',
  ): string {
    if (!Array.isArray(condition)) {
      throw new TypeError('Non-array condition.');
    }

    const normalizedLogic = normalizeLogic(logic);
    return `(${condition
      .map((entry) => this.makeWhere(model, entry, 'AND'))
      .join(` ${normalizedLogic} `)})`;
  }

  makeWhere(
    model: MySQLModel,
    condition: Readonly<Record<string, unknown>> | readonly Readonly<Record<string, unknown>>[],
    logic: string = 'AND',
  ): string {
    const normalizedLogic = normalizeLogic(logic);
    if (Array.isArray(condition)) {
      return this.makeArrayWhere(model, condition, normalizedLogic);
    }
    if (!isRecord(condition)) {
      throw new TypeError('SQL condition must be an object or array.');
    }

    const fragments: string[] = [];
    for (const [key, value] of Object.entries(condition)) {
      if (key === '$and' || key === '$or') {
        const nestedLogic = key === '$and' ? 'AND' : 'OR';
        if (Array.isArray(value)) {
          fragments.push(this.makeArrayWhere(
            model,
            value.map(assertConditionRecord),
            nestedLogic,
          ));
        } else {
          fragments.push(this.makeWhere(
            model,
            assertConditionRecord(value),
            nestedLogic,
          ));
        }
        continue;
      }

      fragments.push(this.makeFieldWhere(model, key, value, normalizedLogic));
    }

    return `(${fragments.join(` ${normalizedLogic} `)})`;
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
    const assignments: string[] = [];
    for (const [key, value] of Object.entries(update)) {
      const field = model.fieldNamesMap[key];
      if (field === undefined) {
        continue;
      }

      assignments.push(`${quoteIdentifier(field.column)} = ${this.makeSetValue(
        model,
        field,
        value,
      )}`);
    }
    return assignments.join(', ');
  }

  makeFind(model: MySQLModel, options: MySQLQueryOptions = {}): string {
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

    let sql = `SELECT ${selected} FROM ${quoteIdentifier(model.name)}`;
    const index = this.makeIndex(model, options.index);
    if (index) {
      sql += ` ${index}`;
    }
    sql += this.makeWhereClause(model, options.where);
    sql += this.makeOrderClause(model, options.order);
    sql += this.makeLimitClause(model, options.limit);
    return sql;
  }

  makeUpdate(model: MySQLModel, options: MySQLQueryOptions = {}): string {
    const set = this.makeSet(model, options.update ?? {});
    if (!set) {
      throw new Error('no set data.');
    }

    let sql = `UPDATE ${quoteIdentifier(model.name)}`;
    const index = this.makeIndex(model, options.index);
    if (index) {
      sql += ` ${index}`;
    }
    sql += ` SET ${set}`;
    sql += this.makeWhereClause(model, options.where);
    sql += this.makeOrderClause(model, options.order);
    sql += this.makeLimitClause(model, options.limit);
    return sql;
  }

  makeDelete(model: MySQLModel, options: MySQLQueryOptions = {}): string {
    let sql = `DELETE FROM ${quoteIdentifier(model.name)}`;
    sql += this.makeWhereClause(model, options.where);
    sql += this.makeOrderClause(model, options.order);

    const limit = options.limit;
    if (limit !== undefined && limit.length > 0) {
      if (limit.length === 1) {
        sql += ` LIMIT ${normalizeLimit(limit[0])}`;
      } else if (limit[0] === 0) {
        sql += ` LIMIT ${normalizeLimit(limit[1])}`;
      } else {
        throw new Error('MySQL DELETE supports a row count but not a non-zero offset.');
      }
    }
    return sql;
  }

  makeSql(
    type: SqlOperation,
    model: MySQLModel,
    options: MySQLQueryOptions = {},
  ): string {
    switch (type) {
      case 'count':
        return this.makeFind(model, { ...options, count: true });
      case 'delete':
        return this.makeDelete(model, options);
      case 'update':
        return this.makeUpdate(model, options);
      case 'find':
        return this.makeFind(model, options);
      default:
        return this.makeFind(model, options);
    }
  }

  private makeOperator(
    field: MySQLField,
    operator: FieldOperator,
    operand: unknown,
  ): string {
    const symbol = fieldOperators[operator];
    const column = quoteIdentifier(field.column);

    if (symbol === 'IN') {
      if (!Array.isArray(operand) || operand.length === 0) {
        throw new TypeError('$in requires a non-empty array.');
      }
      const values = operand.map((value) => this.restore(field, value));
      return `${column} IN (${values.map(formatValue).join(', ')})`;
    }

    if (symbol === 'BETWEEN') {
      if (!Array.isArray(operand) || operand.length !== 2) {
        throw new TypeError('$between requires exactly two values.');
      }
      return `${column} BETWEEN ${formatValue(this.restore(field, operand[0]))} AND ${formatValue(this.restore(field, operand[1]))}`;
    }

    const logicalValues = splitLogicalValues(operand);
    const andFragments = logicalValues.and.map((value) => this.makeComparison(
      field,
      symbol,
      value,
    ));
    const orFragments = logicalValues.or.map((value) => this.makeComparison(
      field,
      symbol,
      value,
    ));
    const andSql = groupFragments(andFragments, 'AND');
    const orSql = groupFragments(orFragments, 'OR');

    if (andSql && orSql) {
      return `(${andSql} AND ${orSql})`;
    }
    return andSql || orSql;
  }

  private makeComparison(
    field: MySQLField,
    symbol: string,
    value: unknown,
  ): string {
    const column = quoteIdentifier(field.column);
    if ((symbol === '=' || symbol === '!=') && value === null) {
      return `${column} IS ${symbol === '=' ? 'NULL' : 'NOT NULL'}`;
    }
    return `${column} ${symbol} ${formatValue(this.restore(field, value))}`;
  }

  private makeEquality(field: MySQLField, value: unknown): string {
    if (value === null) {
      return `${quoteIdentifier(field.column)} IS NULL`;
    }
    return `${quoteIdentifier(field.column)} = ${formatValue(this.restore(field, value))}`;
  }

  private makeSetValue(
    model: MySQLModel,
    field: MySQLField,
    value: unknown,
  ): string {
    if (value === null) {
      if (!field.allowNull) {
        throw new TypeError(`field "${field.name}" does not allow null.`);
      }
      return 'NULL';
    }

    if (isRawExpression(value)) {
      return sqlNameToColumn(value.slice(2, -2), completeNameToColumn(model));
    }
    return formatValue(this.restore(field, value));
  }

  private restore(field: MySQLField, value: unknown): unknown {
    return field.restore(value);
  }

  private makeWhereClause(
    model: MySQLModel,
    where?: Readonly<Record<string, unknown>>,
  ): string {
    if (where === undefined || Object.keys(where).length === 0) {
      return '';
    }
    return ` WHERE ${this.makeWhere(model, where)}`;
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

function formatValue(value: unknown): string {
  return mysqlFormat('?', [value as never]);
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

function groupFragments(fragments: readonly string[], logic: SqlLogic): string {
  const sql = fragments.filter(Boolean).join(` ${logic} `);
  return fragments.length > 1 ? `(${sql})` : sql;
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
