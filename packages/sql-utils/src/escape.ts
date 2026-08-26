type EscapeMap = Record<string, string>;

/**
 * Generic escape function that handles string escaping based on the provided escape map.
 *
 * @param {string} str The string to be escaped.
 * @param {EscapeMap} escapeMap A map of characters to their escaped versions.
 * @return {string} The escaped string.
 */
function escapeGeneric(str: string, escapeMap: EscapeMap): string {
  const result: string[] = [];
  let lastIndex = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const escaped = escapeMap[ch];

    if (escaped !== undefined) {
      if (i > lastIndex) {
        result.push(str.substring(lastIndex, i));
      }
      result.push(escaped);
      lastIndex = i + 1;
    }
  }

  if (lastIndex < str.length) {
    result.push(str.substring(lastIndex));
  }

  return result.join('');
}

/**
 * Escapes special characters in a string to prevent SQL injection when used in SQL queries.
 * This function should be used on user-provided input before it is inserted into a SQL query.
 *
 * Escapes the following characters:
 * - \n (newline)
 * - ' (single quote)
 * - " (double quote)
 * - \t (tab)
 * - \0 (null byte)
 * - \r (carriage return)
 * - \b (backspace)
 * - \x1a (substitute character)
 * - \ (backslash)
 *
 * @param {string} str The string to be escaped for use in SQL queries.
 * @return {string} The escaped string safe for use in SQL queries.
 */
export function escape(str: string): string {
  if (typeof str !== 'string') {
    return str;
  }

  const sqlEscapeMap: EscapeMap = {
    '\n': '\\n',
    '\'': '\\\'',
    '"': '\\"',
    '\t': '\\t',
    '\0': '\\0',
    '\r': '\\r',
    '\b': '\\b',
    '\x1a': '\\Z',
    '\\': '\\\\',
  };

  return escapeGeneric(str, sqlEscapeMap);
}

/**
 * Escapes special wildcard characters used in SQL LIKE clauses.
 * This function should be used on user-provided input that will be used in a LIKE clause.
 *
 * Escapes the following characters:
 * - _ (underscore): matches any single character in LIKE clauses
 * - % (percent sign): matches any sequence of characters in LIKE clauses
 *
 * @param {string} str The string to be escaped for use in SQL LIKE clauses.
 * @return {string} The escaped string safe for use in SQL LIKE clauses.
 */
export function escapeLike(str: string): string {
  const likeEscapeMap: EscapeMap = {
    _: '\\_',
    '%': '\\%',
  };

  return escapeGeneric(str, likeEscapeMap);
}
