type EscapeMap = Record<string, string>;

/**
 * Generic escape function that handles string escaping based on the provided escape map.
 * @zh 根据给定的转义表处理字符串的通用转义函数。
 * @ja 指定されたエスケープ表に基づいて文字列を処理する、汎用のエスケープ関数です。
 * @param str - The string to escape.
 * @zh str - 要转义的字符串。
 * @ja str - エスケープする文字列です。
 * @param escapeMap - Characters mapped to their escaped forms.
 * @zh escapeMap - 字符到其转义形式的映射。
 * @ja escapeMap - 文字とそのエスケープ後の形式との対応表です。
 * @returns The escaped string.
 * @zh 转义后的字符串。
 * @ja エスケープ後の文字列です。
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
 * @zh 转义字符串中的特殊字符，防止其用于 SQL 查询时发生 SQL 注入。
 * 把用户输入插入 SQL 查询前，应先调用此函数。
 *
 * 会转义以下字符：
 * - \n（换行）
 * - '（单引号）
 * - "（双引号）
 * - \t（制表符）
 * - \0（空字节）
 * - \r（回车）
 * - \b（退格）
 * - \x1a（替代字符）
 * - \（反斜杠）
 * @ja SQL クエリで使用したときに SQL インジェクションが起きないよう、文字列内の特殊文字をエスケープします。
 * ユーザーが入力した値を SQL クエリへ挿入する前に、この関数を使用してください。
 *
 * 次の文字をエスケープします。
 * - \n（改行）
 * - '（シングルクォート）
 * - "（ダブルクォート）
 * - \t（タブ）
 * - \0（null byte）
 * - \r（キャリッジリターン）
 * - \b（バックスペース）
 * - \x1a（置換文字）
 * - \（バックスラッシュ）
 * @param str - The string to be escaped for use in SQL queries.
 * @zh str - 要转义并用于 SQL 查询的字符串。
 * @ja str - SQL クエリで使用するためにエスケープする文字列です。
 * @returns The escaped string safe for use in SQL queries.
 * @zh 经过转义、可安全用于 SQL 查询的字符串。
 * @ja エスケープ済みで、SQL クエリに安全に使用できる文字列です。
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
 * @zh 转义 SQL LIKE 子句使用的特殊通配字符。
 * 用户输入用于 LIKE 子句前，应先调用此函数。
 *
 * 会转义以下字符：
 * - _（下划线）：在 LIKE 子句中匹配任意单个字符
 * - %（百分号）：在 LIKE 子句中匹配任意字符序列
 * @ja SQL の LIKE 句で使用する特殊なワイルドカード文字をエスケープします。
 * ユーザーが入力した値を LIKE 句で使用する前に、この関数を使用してください。
 *
 * 次の文字をエスケープします。
 * - _（アンダースコア）：LIKE 句では任意の 1 文字に一致します
 * - %（パーセント記号）：LIKE 句では任意の文字列に一致します
 * @param str - The string to be escaped for use in SQL LIKE clauses.
 * @zh str - 要转义并用于 SQL LIKE 子句的字符串。
 * @ja str - SQL の LIKE 句で使用するためにエスケープする文字列です。
 * @returns The escaped string safe for use in SQL LIKE clauses.
 * @zh 经过转义、可安全用于 SQL LIKE 子句的字符串。
 * @ja エスケープ済みで、SQL の LIKE 句に安全に使用できる文字列です。
 */
export function escapeLike(str: string): string {
  const likeEscapeMap: EscapeMap = {
    _: '\\_',
    '%': '\\%',
  };

  return escapeGeneric(str, likeEscapeMap);
}
