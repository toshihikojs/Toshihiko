import { sqlNameToColumn } from '@toshihiko/sql-utils';
import { format as mysqlFormat } from 'mysql2';
import type { DataRow, DataValue } from 'toshihiko';
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

/**
 * Compiles Toshihiko query structures into MySQL statements.
 *
 * `compile*` methods return parameterized SQL plus placeholder values. `make*`
 * methods format those statements into strings for compatibility and logging.
 * @zh 把 Toshihiko 查询结构编译为 MySQL 语句。
 *
 * `compile*` 方法会返回参数化 SQL 和占位符值。`make*`
 * 方法会把这些语句格式化为字符串，以便兼容和记录日志。
 * @ja Toshihiko のクエリ構造を MySQL 文へコンパイルします。
 *
 * `compile*` メソッドは、パラメーター化された SQL とプレースホルダー値を返します。`make*` メソッドは、互換性とログ出力のために、それらの文を文字列へフォーマットします。
 */
export class MySQLSqlBuilder {
  /**
   * Compiles one logical field condition.
   * @zh 编译一个逻辑字段条件。
   * @ja 1 個の論理フィールド条件をコンパイルします。
   */
  compileFieldWhere(
    model: MySQLModel,
    key: string,
    condition: DataValue,
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

    for (const [rawOperator, operand] of Object.entries(condition as DataRow)) {
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

  /**
   * Formats one logical field condition as SQL text.
   * @zh 把一个逻辑字段条件格式化为 SQL 文本。
   * @ja 1 個の論理フィールド条件を SQL テキストとしてフォーマットします。
   */
  makeFieldWhere(
    model: MySQLModel,
    key: string,
    condition: DataValue,
    logic: string = 'AND',
  ): string {
    return formatStatement(this.compileFieldWhere(model, key, condition, logic));
  }

  /**
   * Compiles an array of condition objects joined with `AND` or `OR`.
   * @zh 编译由以下逻辑连接的条件对象数组：`AND` 或 `OR`。
   * @ja `AND` または `OR` で結合された条件オブジェクトの配列をコンパイルします。
   */
  compileArrayWhere(
    model: MySQLModel,
    condition: readonly DataRow[],
    logic: string = 'AND',
  ): MySQLStatement {
    if (!Array.isArray(condition)) {
      throw new Error('Non-array condition.');
    }

    const normalizedLogic = normalizeLogic(logic);
    return groupStatements(
      condition.map((entry) => this.compileWhere(model, entry, 'AND')),
      normalizedLogic,
      true,
    );
  }

  /**
   * Formats an array of condition objects as SQL text.
   * @zh 把条件对象数组格式化为 SQL 文本。
   * @ja 条件オブジェクトの配列を SQL テキストとしてフォーマットします。
   */
  makeArrayWhere(
    model: MySQLModel,
    condition: readonly DataRow[],
    logic: string = 'AND',
  ): string {
    return formatStatement(this.compileArrayWhere(model, condition, logic));
  }

  /**
   * Recursively compiles a complete Toshihiko condition.
   * @zh 递归编译一个完整 Toshihiko 条件。
   * @ja 完全な Toshihiko 条件を再帰的にコンパイルします。
   */
  compileWhere(
    model: MySQLModel,
    condition: DataRow | readonly DataRow[],
    logic: string = 'AND',
  ): MySQLStatement {
    const normalizedLogic = normalizeLogic(logic);
    if (Array.isArray(condition)) {
      return this.compileArrayWhere(model, condition, normalizedLogic);
    }
    const fragments: MySQLStatement[] = [];
    for (const [key, value] of Object.entries(condition)) {
      if (key === '$and' || key === '$or') {
        const nestedLogic = key === '$and' ? 'AND' : 'OR';
        if (Array.isArray(value)) {
          fragments.push(this.compileArrayWhere(
            model,
            value as readonly DataRow[],
            nestedLogic,
          ));
        } else {
          fragments.push(this.compileWhere(
            model,
            value as DataRow,
            nestedLogic,
          ));
        }
        continue;
      }

      fragments.push(this.compileFieldWhere(model, key, value, normalizedLogic));
    }

    return groupStatements(fragments, normalizedLogic, true);
  }

  /**
   * Formats a complete Toshihiko condition as SQL text.
   * @zh 把完整 Toshihiko 条件格式化为 SQL 文本。
   * @ja 完全な Toshihiko 条件を SQL テキストとしてフォーマットします。
   */
  makeWhere(
    model: MySQLModel,
    condition: DataRow | readonly DataRow[],
    logic: string = 'AND',
  ): string {
    return formatStatement(this.compileWhere(model, condition, logic));
  }

  /**
   * Formats normalized order entries with quoted storage column names.
   * @zh 使用带引号的存储列名格式化规范化 order 条目。
   * @ja 引用符で囲んだストレージ列名を使用して、正規化済みの order 項目をフォーマットします。
   */
  makeOrder(
    model: MySQLModel,
    order: readonly Readonly<Record<string, number>>[],
  ): string {
    const fragments: string[] = [];
    for (const entry of order) {
      const key = Object.keys(entry)[0];
      if (key === undefined) {
        continue;
      }
      const field = getField(model, key);
      fragments.push(`${quoteIdentifier(field.column)} ${Number(entry[key]) > 0 ? 'ASC' : 'DESC'}`);
    }
    return fragments.join(', ');
  }

  /**
   * Formats one or two normalized values as a MySQL limit body.
   * @zh 把一个或两个规范化值格式化为 MySQL limit 主体。
   * @ja 正規化済みの 1 個または 2 個の値を MySQL の limit 本体としてフォーマットします。
   */
  makeLimit(
    _model: MySQLModel,
    limit: readonly (number | string)[],
  ): string {
    return limit.map(normalizeLimit).join(', ');
  }

  /**
   * Formats an optional quoted `FORCE INDEX` clause.
   * @zh 格式化可选且带引号的 `FORCE INDEX` 子句。
   * @ja 引用符付きの任意の `FORCE INDEX` 句をフォーマットします。
   */
  makeIndex(_model: MySQLModel, index?: string): string {
    return index ? `FORCE INDEX(${quoteIdentifier(index)})` : '';
  }

  /**
   * Formats logical update values as a SQL assignment list.
   * @zh 把逻辑更新值格式化为 SQL 赋值列表。
   * @ja 論理的な更新値を SQL の代入リストとしてフォーマットします。
   */
  makeSet(
    model: MySQLModel,
    update: DataRow,
  ): string {
    return formatStatement(this.compileSet(model, update));
  }

  /**
   * Compiles logical update values into parameterized assignments.
   * @zh 把逻辑更新值编译为参数化赋值。
   * @ja 論理的な更新値をパラメーター化された代入へコンパイルします。
   */
  compileSet(
    model: MySQLModel,
    update: DataRow,
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

  /**
   * Restores one application value and produces a placeholder statement.
   * @zh 还原一个应用层值并生成占位符语句。
   * @ja 1 個のアプリケーション値をストレージ表現へ戻し、プレースホルダー式を生成します。
   */
  compileValue(field: MySQLField, value: DataValue): MySQLStatement {
    if (value === null) {
      return statement('NULL');
    }
    return this.compileRestoredValue(field, value);
  }

  /**
   * Formats a complete `SELECT` statement.
   * @zh 格式化完整的 `SELECT` 语句。
   * @ja 完全な `SELECT` 文をフォーマットします。
   */
  makeFind(model: MySQLModel, options: MySQLQueryOptions = {}): string {
    return formatStatement(this.compileFind(model, options));
  }

  /**
   * Compiles a parameterized `SELECT` statement.
   * @zh 编译参数化的 `SELECT` 语句。
   * @ja パラメーター化された `SELECT` 文をコンパイルします。
   */
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

  /**
   * Formats a complete `UPDATE` statement.
   * @zh 格式化完整的 `UPDATE` 语句。
   * @ja 完全な `UPDATE` 文をフォーマットします。
   */
  makeUpdate(model: MySQLModel, options: MySQLQueryOptions = {}): string {
    return formatStatement(this.compileUpdate(model, options));
  }

  /**
   * Compiles a parameterized `UPDATE` statement.
   * @zh 编译参数化的 `UPDATE` 语句。
   * @ja パラメーター化された `UPDATE` 文をコンパイルします。
   */
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

  /**
   * Formats a complete `DELETE` statement.
   * @zh 格式化完整的 `DELETE` 语句。
   * @ja 完全な `DELETE` 文をフォーマットします。
   */
  makeDelete(model: MySQLModel, options: MySQLQueryOptions = {}): string {
    return formatStatement(this.compileDelete(model, options));
  }

  /**
   * Compiles a parameterized `DELETE` statement.
   * @zh 编译参数化的 `DELETE` 语句。
   * @ja パラメーター化された `DELETE` 文をコンパイルします。
   */
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
        throw new Error(
          'Invalid limit in delete. Refer to '
          + 'http://dev.mysql.com/doc/refman/5.7/en/delete.html#idm139816273062400, '
          + 'https://www.techonthenet.com/mysql/delete_limit.php and '
          + 'http://stackoverflow.com/questions/7142097/mysql-delete-statement-with-limit#answer-7142118',
        );
      }
    }
    return result;
  }

  /**
   * Formats the statement selected by an operation name.
   * @zh 格式化操作名选中的语句。
   * @ja 操作名に対応する文をフォーマットします。
   */
  makeSql(
    type: SqlOperation,
    model: MySQLModel,
    options: MySQLQueryOptions = {},
  ): string {
    return formatStatement(this.compileSql(type, model, options));
  }

  /**
   * Compiles the parameterized statement selected by an operation name.
   * @zh 编译由操作名选中的参数化语句。
   * @ja 操作名に対応するパラメーター化された文をコンパイルします。
   */
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
    operand: DataValue,
  ): MySQLStatement {
    const symbol = fieldOperators[operator];
    const column = quoteIdentifier(field.column);

    if (symbol === 'IN') {
      const values = (operand as readonly DataValue[]).map((value) => this.compileRestoredValue(field, value));
      const compiled = joinStatements(values, ', ');
      return { sql: `${column} IN (${compiled.sql})`, values: compiled.values };
    }

    if (symbol === 'BETWEEN') {
      const between = operand as readonly DataValue[];
      const compiled = joinStatements([
        this.compileRestoredValue(field, between[0]),
        this.compileRestoredValue(field, between[1]),
      ], ' AND ');
      return { sql: `${column} BETWEEN ${compiled.sql}`, values: compiled.values };
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
    value: DataValue,
  ): MySQLStatement {
    const column = quoteIdentifier(field.column);
    if ((symbol === '=' || symbol === '!=') && value === null) {
      return statement(`${column} IS ${symbol === '=' ? 'NULL' : 'NOT NULL'}`);
    }
    const compiled = this.compileRestoredValue(field, value);
    return {
      sql: `${column} ${symbol} ${compiled.sql}`,
      values: compiled.values,
    };
  }

  private compileEquality(field: MySQLField, value: DataValue): MySQLStatement {
    const compiled = this.compileRestoredValue(field, value);
    return {
      sql: `${quoteIdentifier(field.column)} = ${compiled.sql}`,
      values: compiled.values,
    };
  }

  private compileSetValue(
    model: MySQLModel,
    field: MySQLField,
    value: DataValue,
  ): MySQLStatement {
    if (value === null) {
      if (field.allowNull) return statement('NULL');
      return this.compileRestoredValue(field, value);
    }

    if (isRawExpression(value)) {
      return statement(sqlNameToColumn(value.slice(2, -2), completeNameToColumn(model)));
    }
    return this.compileRestoredValue(field, value);
  }

  private restore(field: MySQLField, value: DataValue): MySQLStatement['values'][number] {
    return field.restore(value);
  }

  private compileRestoredValue(
    field: MySQLField,
    value: DataValue,
  ): MySQLStatement {
    const restored = this.restore(field, value);
    if (field.type?.needQuotes === false && typeof restored === 'string') {
      return statement(restored);
    }
    return { sql: '?', values: [restored] };
  }

  private compileWhereClause(
    model: MySQLModel,
    where?: DataRow,
  ): MySQLStatement {
    if (where === undefined || Object.keys(where).length === 0) {
      return statement('');
    }
    const compiled = this.compileWhere(model, where);
    return { sql: ` WHERE ${compiled.sql}`, values: compiled.values };
  }

  private makeOrderClause(
    model: MySQLModel,
    order?: readonly Readonly<Record<string, number>>[],
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
  return `\`${identifier}\``;
}

function normalizeLogic(logic: string): SqlLogic {
  return logic.toUpperCase() === 'OR' ? 'OR' : 'AND';
}

function normalizeLimit(value: number | string | undefined): number {
  const normalized = parseInt(value as string);
  if (!Number.isFinite(normalized)) {
    return 0;
  }
  return normalized;
}

function splitLogicalValues(value: DataValue): {
  readonly and: readonly DataValue[];
  readonly or: readonly DataValue[];
} {
  if (isRecord(value) && ('$and' in value || '$or' in value)) {
    return {
      and: toArray(value.$and as DataValue),
      or: toArray(value.$or as DataValue),
    };
  }
  return { and: toArray(value), or: [] };
}

function toArray(value: DataValue): readonly DataValue[] {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value as readonly DataValue[] : [value];
}

function isFieldOperator(value: string): value is FieldOperator {
  return Object.prototype.hasOwnProperty.call(fieldOperators, value);
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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
