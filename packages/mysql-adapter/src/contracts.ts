import type {
  AdapterQuery,
} from '@toshihiko/base-adapter';
import type { Cache, CacheSource, DataRow, DataValue } from 'toshihiko';
import type {
  Pool,
  PoolConnection,
  PoolOptions,
  QueryValues,
  QueryResult,
  ResultSetHeader,
} from 'mysql2/promise';

/**
 * One value accepted by mysql2 query placeholders.
 * @zh mysql2 查询占位符接受的一个值。
 * @ja mysql2 のクエリプレースホルダーが受け付ける 1 個の値です。
 */
export type MySQLValue = QueryValues;

/**
 * Positional or named placeholder values accepted by mysql2.
 * @zh mysql2 接受的位置或命名占位符值。
 * @ja mysql2 が受け付ける位置指定または名前付きのプレースホルダー値です。
 */
export type MySQLValues =
  | readonly MySQLValue[]
  | Readonly<Record<string, MySQLValue>>;

/**
 * SQL logging option: disabled, console logging, or a custom sink.
 * @zh SQL 日志选项：关闭、输出到控制台或使用自定义 sink。
 * @ja SQL ログのオプションです。無効、コンソール出力、またはカスタム出力先を指定できます。
 */
export type MySQLShowSql = false | true | ((sql: string) => void);

/**
 * mysql2 Pool options plus Toshihiko Adapter configuration.
 * @zh mysql2 Pool 选项和 Toshihiko Adapter 配置。
 * @ja mysql2 の Pool オプションと Toshihiko Adapter の設定です。
 */
export interface MySQLAdapterOptions extends Omit<
  PoolOptions,
  'database' | 'password' | 'user'
> {
  /**
   * Cache instance or module-style Cache configuration.
   * @zh Cache 实例或模块式 Cache 配置。
   * @ja Cache インスタンス、またはモジュール形式の Cache 設定です。
   */
  readonly cache?: CacheSource;
  /**
   * Database name; defaults to `toshihiko`.
   * @zh 数据库名；默认值为 `toshihiko`。
   * @ja データベース名です。既定値は `toshihiko` です。
   */
  readonly database?: string;
  /**
   * MySQL password.
   * @zh MySQL 密码。
   * @ja MySQL のパスワードです。
   */
  readonly password?: string;
  /**
   * Driver package name retained for compatibility.
   * @zh 为兼容性保留的驱动软件包名。
   * @ja 互換性のために保持するドライバーパッケージ名です。
   */
  readonly package?: string;
  /**
   * Existing mysql2 Pool.
   * @zh 现有 mysql2 Pool。
   * @ja 既存の mysql2 Pool です。
   */
  readonly pool?: Pool;
  /**
   * SQL logging behavior.
   * @zh SQL 日志行为。
   * @ja SQL ログの出力方法です。
   */
  readonly showSql?: MySQLShowSql;
  /**
   * MySQL username.
   * @zh MySQL 用户名。
   * @ja MySQL のユーザー名です。
   */
  readonly user?: string;
  /**
   * Compatibility alias for {@link user}.
   * @zh 兼容性别名：{@link user}。
   * @ja {@link user} の互換エイリアスです。
   */
  readonly username?: string;
}

/**
 * Minimal compiled Field surface required by the MySQL Adapter.
 * @zh MySQL Adapter 所需的最小编译后 Field 接口。
 * @ja MySQL Adapter が必要とする、コンパイル済み Field の最小インターフェースです。
 */
export interface MySQLField {
  /**
   * Whether the field accepts `null`.
   * @zh 字段是否接受 `null`。
   * @ja フィールドが `null` を受け付けるかどうかです。
   */
  readonly allowNull: boolean;
  /**
   * Whether MySQL generates the field during insert.
   * @zh MySQL 是否会在 insert 时生成此字段。
   * @ja insert 時に MySQL がこのフィールドを生成するかどうかです。
   */
  readonly autoIncrement: boolean;
  /**
   * Quoted storage column source name.
   * @zh 带引号的存储列源名称。
   * @ja 引用符で囲まれたストレージ列の元の名前です。
   */
  readonly column: string;
  /**
   * Logical schema field name.
   * @zh 逻辑 schema 字段名。
   * @ja schema 上の論理フィールド名です。
   */
  readonly name: string;
  /**
   * Whether the field participates in row locators.
   * @zh 字段是否参与数据行定位。
   * @ja データ行の特定条件にこのフィールドを使用するかどうかです。
   */
  readonly primaryKey: boolean;
  /**
   * Minimal quoting metadata used by the SQL builder.
   * @zh SQL builder 使用的最小引号元数据。
   * @ja SQL builder が使用する、引用符に関する最小限のメタデータです。
   */
  readonly type?: {
    readonly needQuotes?: boolean;
  };
  /**
   * Restores an application value into a mysql2-compatible value.
   * @zh 把应用层值还原为兼容 mysql2 的值。
   * @ja アプリケーション値を mysql2 互換の値へ戻します。
   */
  restore(value: DataValue): MySQLValue;
}

/**
 * Minimal Model surface required by the MySQL Adapter.
 * @zh MySQL Adapter 所需的最小 Model 接口。
 * @ja MySQL Adapter が必要とする最小限の Model インターフェースです。
 */
export interface MySQLModel {
  /**
   * Compatibility alias for {@link autoIncrementField}.
   * @zh 兼容性别名：{@link autoIncrementField}。
   * @ja {@link autoIncrementField} の互換エイリアスです。
   */
  readonly ai: MySQLField | null;
  /**
   * Auto-increment field, when configured.
   * @zh 自增字段（如果已配置）。
   * @ja 設定されている場合の自動インクリメントフィールドです。
   */
  readonly autoIncrementField: MySQLField | null;
  /**
   * Effective Model Cache.
   * @zh 实际生效的 Model Cache。
   * @ja 実際に使用される Model の Cache です。
   */
  readonly cache: Cache | null;
  /**
   * Logical field name to compiled Field.
   * @zh 逻辑字段名到编译后 Field 的映射。
   * @ja 論理フィールド名からコンパイル済み Field への対応です。
   */
  readonly fieldNamesMap: Readonly<Record<string, MySQLField | undefined>>;
  /**
   * Storage table name.
   * @zh 存储层表名。
   * @ja ストレージ上のテーブル名です。
   */
  readonly name: string;
  /**
   * Logical field name to storage column.
   * @zh 逻辑字段名到存储列的映射。
   * @ja 論理フィールド名からストレージ列への対応です。
   */
  readonly nameToColumn: Readonly<Record<string, string | undefined>>;
  /**
   * Fields used to locate one row.
   * @zh 用于定位一行数据的字段。
   * @ja 1 行を特定するために使用するフィールドです。
   */
  readonly primaryKeys: readonly MySQLField[];
  /**
   * Complete compiled schema.
   * @zh 完整的编译后 schema。
   * @ja コンパイル済みの完全な schema です。
   */
  readonly schema: readonly MySQLField[];
  /**
   * Converts a storage row to logical field names.
   * @zh 把存储层数据行转换为逻辑字段名。
   * @ja ストレージ上のデータ行を論理フィールド名へ変換します。
   */
  convertColumnToName(
    value: DataRow,
  ): DataRow;
}

/**
 * Normalized Query shape consumed by the MySQL Adapter.
 * @zh MySQL Adapter 使用的规范化 Query 结构。
 * @ja MySQL Adapter が処理する正規化済みの Query 構造です。
 */
export interface MySQLQuery extends AdapterQuery<
  MySQLModel,
  PoolConnection,
  Cache | null
> {}

/**
 * Internal SQL-builder options derived from a normalized Query.
 * @zh 从规范化 Query 派生的内部 SQL builder 选项。
 * @ja 正規化済みの Query から導出した、SQL builder 内部のオプションです。
 */
export interface MySQLQueryOptions {
  /**
   * Selected mysql2 transaction connection.
   * @zh 选中的 mysql2 事务连接。
   * @ja 選択されている mysql2 のトランザクション接続です。
   */
  conn?: PoolConnection | null;
  /**
   * Compile a count projection.
   * @zh 编译 count 投影。
   * @ja count 用の選択式をコンパイルします。
   */
  count?: boolean;
  /**
   * Logical fields or expressions to select.
   * @zh 要选择的逻辑字段或表达式。
   * @ja 選択する論理フィールドまたは式です。
   */
  fields?: string[];
  /**
   * Optional index hint.
   * @zh 可选的索引提示。
   * @ja 任意のインデックスヒントです。
   */
  index?: string;
  /**
   * Empty, `[count]`, or `[offset, count]`.
   * @zh 空值、`[count]`，或 `[offset, count]`。
   * @ja 空、`[count]`、または `[offset, count]` です。
   */
  limit?: number[];
  /**
   * Bypass query-result caching.
   * @zh 绕过查询结果缓存。
   * @ja クエリ結果のキャッシュを使用しません。
   */
  noCache?: boolean;
  /**
   * Normalized sort expressions.
   * @zh 规范化后的排序表达式。
   * @ja 正規化済みのソート式です。
   */
  order?: Record<string, number>[];
  /**
   * Request at most one row.
   * @zh 最多请求一行数据。
   * @ja 要求するデータ行を最大 1 行にします。
   */
  single?: boolean;
  /**
   * Logical field values for an update.
   * @zh 更新使用的逻辑字段值。
   * @ja 更新に使用する論理フィールドの値です。
   */
  update?: DataRow;
  /**
   * Logical query condition.
   * @zh 逻辑查询条件。
   * @ja 論理的なクエリ条件です。
   */
  where?: DataRow;
}

/**
 * Parameterized SQL text and its ordered placeholder values.
 * @zh 参数化 SQL 文本及其有序占位符值。
 * @ja パラメーター化された SQL テキストと、順序付きのプレースホルダー値です。
 */
export interface MySQLStatement {
  /**
   * SQL text containing `?` placeholders.
   * @zh 包含以下内容的 SQL 文本：`?` 占位符。
   * @ja `?` プレースホルダーを含む SQL テキストです。
   */
  readonly sql: string;
  /**
   * Values bound to placeholders in order.
   * @zh 按顺序绑定到占位符的值。
   * @ja 順番にプレースホルダーへバインドする値です。
   */
  readonly values: readonly MySQLValue[];
}

/**
 * Raw execution overloads accepted by `Toshihiko.execute()`.
 * @zh 以下方法接受的 raw execute 重载：`Toshihiko.execute()`。
 * @ja `Toshihiko.execute()` が受け付ける、生の実行処理のオーバーロードです。
 */
export type MySQLExecuteArguments =
  | readonly [sql: string, values?: MySQLValues]
  | readonly [
    connection: PoolConnection | null,
    sql: string,
    values?: MySQLValues,
  ];

/**
 * Raw execution arguments accepted after `Query.conn()`.
 * @zh 调用 `Query.conn()` 后接受的 raw execute 参数。
 * @ja `Query.conn()` の呼び出し後に受け付ける、生の実行引数です。
 */
export type MySQLQueryExecuteArguments = readonly [
  sql: string,
  values?: MySQLValues,
];

export type {
  Pool as MySQLPool,
  PoolConnection as MySQLConnection,
  QueryResult as MySQLQueryResult,
  ResultSetHeader as MySQLMutationResult,
};
