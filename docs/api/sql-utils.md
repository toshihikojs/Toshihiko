# SQL utilities

`@toshihiko/sql-utils` exports three string helpers. Use driver-bound parameters for user-controlled values whenever possible.

## `escape()`

```typescript
escape(value: string): string
```

Escapes newline, quotes, tab, null byte, carriage return, backspace, substitute character, and backslash with MySQL-style backslash sequences.

```typescript
escape("O'Reilly"); // O\'Reilly
```

The runtime implementation returns a non-string input unchanged for compatibility, although the public TypeScript signature accepts a string.

## `escapeLike()`

```typescript
escapeLike(value: string): string
```

Escapes `%` and `_` with a backslash. It does not perform the general escaping done by `escape()`.

```typescript
const pattern = `%${escapeLike(input)}%`;
await database.execute(
  'SELECT * FROM users WHERE name LIKE ?',
  [pattern],
);
```

## `sqlNameToColumn()`

```typescript
sqlNameToColumn(
  sql: string,
  fragmentMap: Record<string, string>,
): string
```

Replaces logical identifiers in an SQL fragment while preserving:

- text inside single or double quotes;
- recognized SQL keywords;
- function names before `(`.

Backtick-quoted identifiers are always eligible for mapping.

```typescript
sqlNameToColumn(
  'ORDER BY createdAt DESC, `displayName` ASC',
  { createdAt: 'created_at', displayName: 'display_name' },
);
// ORDER BY created_at DESC, `display_name` ASC
```

This helper tokenizes only the syntax needed by Toshihiko's compatible SQL fragments. It is not a general SQL parser.

## Core compatibility export

The core package exposes the first two functions through `Escaper`:

```typescript
import { Escaper } from 'toshihiko';

Escaper.escape(value);
Escaper.escapeLike(value);
```

`sqlNameToColumn()` is available only from `@toshihiko/sql-utils`.
