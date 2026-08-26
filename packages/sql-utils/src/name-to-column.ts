import keywords from './keywords';

/**
 * Finds the closing quote in the SQL query string.
 * @param {string} sql The SQL query string.
 * @param {number} startIdx The starting index of the quote.
 * @return {number} The index of the closing quote.
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
 * @param {string} fragment The fragment string.
 * @param {Record<string, string>} fragmentMap The mapping object.
 * @param {boolean} [forceChange=false] Whether to forcefully change the fragment.
 * @return {string} The transformed fragment string.
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
 * @param {string} sql The SQL query string.
 * @param {Record<string, string>} fragmentMap The mapping object.
 * @return {string} The new SQL query string with mapped column names.
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
