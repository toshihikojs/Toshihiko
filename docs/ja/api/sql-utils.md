# SQL ユーティリティ

`@toshihiko/sql-utils` は 3 つの文字列 helper を提供します。ユーザー入力には driver の bound parameter を優先してください。

## `escape()`

```typescript
escape(value: string): string
```

改行、quote、tab、null byte、carriage return、backspace、substitute character、backslash を MySQL 形式で escape します。互換動作として実行時は string 以外をそのまま返しますが、公開 TypeScript signature は string だけを受け付けます。

## `escapeLike()`

```typescript
escapeLike(value: string): string
```

`%` と `_` を backslash で escape します。`escape()` の一般的な escape は行いません。

```typescript
const pattern = `%${escapeLike(input)}%`;
await database.execute('SELECT * FROM users WHERE name LIKE ?', [pattern]);
```

## `sqlNameToColumn()`

```typescript
sqlNameToColumn(sql: string, fragmentMap: Record<string, string>): string
```

SQL fragment の論理フィールド名を置換し、quote 内の text、SQL keyword、関数名を保持します。backtick 付き識別子は mapping 対象です。これは Toshihiko の互換 fragment に必要な構文だけを扱い、一般的な SQL parser ではありません。

コアパッケージは `Escaper.escape()` と `Escaper.escapeLike()` を互換入口として公開します。`sqlNameToColumn()` は `@toshihiko/sql-utils` だけから export されます。
