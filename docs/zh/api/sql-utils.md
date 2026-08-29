# SQL 工具

`@toshihiko/sql-utils` 提供三个字符串工具。用户输入应优先使用驱动的绑定参数。

## `escape()`

```typescript
escape(value: string): string
```

按 MySQL 规则转义换行、引号、Tab、空字节、回车、退格、替换字符和反斜杠。运行时为兼容旧行为会原样返回非字符串，但 TypeScript 公开签名只接受字符串。

## `escapeLike()`

```typescript
escapeLike(value: string): string
```

用反斜杠转义 `%` 与 `_`，不会执行 `escape()` 的通用转义。

```typescript
const pattern = `%${escapeLike(input)}%`;
await database.execute('SELECT * FROM users WHERE name LIKE ?', [pattern]);
```

## `sqlNameToColumn()`

```typescript
sqlNameToColumn(sql: string, fragmentMap: Record<string, string>): string
```

替换 SQL 片段中的逻辑字段名，同时保留引号内文本、SQL 关键字和函数名。反引号包裹的标识符可以映射。它只处理 Toshihiko 兼容片段需要的语法，不是通用 SQL 解析器。

核心软件包通过 `Escaper.escape()` 与 `Escaper.escapeLike()` 保留前两个函数的兼容入口；`sqlNameToColumn()` 只从 `@toshihiko/sql-utils` 导出。
