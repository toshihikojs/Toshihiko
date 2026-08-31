import keywords from './keywords';

/**
 * Finds the closing quote in the SQL query string.
 * @zh 在 SQL 查询字符串中查找右引号。
 * @ja SQL クエリ文字列内で閉じ引用符を検索します。
 * @param sql - The SQL query string.
 * @zh sql - SQL 查询字符串。
 * @ja sql - SQL クエリ文字列です。
 * @param startIdx - The opening quote's index.
 * @zh startIdx - 左引号的索引。
 * @ja startIdx - 開き引用符の位置です。
 * @returns The closing quote's index.
 * @zh 右引号的索引。
 * @ja 閉じ引用符の位置です。
 */
function findClosingQuote(sql: string, startIdx: number): number {
  const start = sql[startIdx];
  for (let i = startIdx + 1; i < sql.length; i++) {
    if (sql[i] === '\\') {
      i++;
      continue;
    }

    if (sql[i] === start) {
      return i;
    }
  }

  return sql.length;
}

/**
 * Transforms a fragment of the SQL query.
 * @zh 转换 SQL 查询的一个片段。
 * @ja SQL クエリの一部分を変換します。
 * @param fragment - The fragment string.
 * @zh fragment - 要转换的片段字符串。
 * @ja fragment - 変換する部分文字列です。
 * @param fragmentMap - The replacement map.
 * @zh fragmentMap - 替换映射。
 * @ja fragmentMap - 置換に使用する対応表です。
 * @param forceChange - Whether to replace the fragment even when it is a keyword.
 * @zh forceChange - 即使片段是关键字，是否仍强制替换。
 * @ja forceChange - キーワードであっても置換するかどうかです。
 * @returns The transformed fragment string.
 * @zh 转换后的片段字符串。
 * @ja 変換後の部分文字列です。
 */
function transformFragment(fragment: string, fragmentMap: Record<string, string>, forceChange = false): string {
  if (forceChange) {
    return fragmentMap[fragment] || fragment;
  }

  // Check if it's a keyword
  if (keywords.includes(fragment.toUpperCase())) {
    return fragment;
  }

  return fragmentMap[fragment] || fragment;
}

/**
 * Parses the SQL query and maps column names using the provided map.
 * @zh 解析 SQL 查询，并使用提供的映射转换列名。
 * @ja SQL クエリを解析し、指定された対応表を使用して列名を変換します。
 * @param sql - The SQL query string.
 * @zh sql - SQL 查询字符串。
 * @ja sql - SQL クエリ文字列です。
 * @param fragmentMap - The mapping object.
 * @zh fragmentMap - 映射对象。
 * @ja fragmentMap - 変換に使用する対応表です。
 * @returns The new SQL query string with mapped column names.
 * @zh 映射列名后的新 SQL 查询字符串。
 * @ja 列名を変換した新しい SQL クエリ文字列です。
 */
export function sqlNameToColumn(sql: string, fragmentMap: Record<string, string>): string {
  let result = '';
  let current = '';

  for (let i = 0; i < sql.length; i++) {
    if (sql[i] === '"' || sql[i] === "'") {
      if (current) {
        result += transformFragment(current, fragmentMap);
        current = '';
      }

      const end = findClosingQuote(sql, i);
      const wrap = sql.substring(i, end + 1);

      result += wrap;
      i = end;
    } else if (sql[i] === ',') {
      if (current) {
        result += transformFragment(current, fragmentMap);
        current = '';
      }
      result += ',';
    } else if (sql[i] === ' ') {
      if (current) {
        result += transformFragment(current, fragmentMap);
        current = '';
      }
      result += ' ';
    } else if (sql[i] === '(') {
      if (current) {
        // current + '(',
        //   e.g., xxx(...
        // we assume it's a function
        result += current;
        current = '';
      }

      result += '(';
    } else if (sql[i] === ')') {
      if (current) {
        result += transformFragment(current, fragmentMap);
        current = '';
      }

      result += ')';
    } else if (sql[i] === '`') {
      if (current) {
        result += transformFragment(current, fragmentMap);
        current = '';
      }

      // The inner SQL is certainly a key or column name!
      const next = sql.indexOf('`', i + 1);
      if (next === -1) {
        const rest = sql.substring(i + 1);
        result += '`' + transformFragment(rest, fragmentMap, true);
        break;
      }

      const fragment = sql.substring(i + 1, next);
      result += '`' + transformFragment(fragment, fragmentMap, true) + '`';
      i = next;
    } else {
      current += sql[i];
    }
  }

  if (current) {
    result += transformFragment(current, fragmentMap);
  }

  return result;
}
