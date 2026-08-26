# @toshihiko/sql-utils

[![Build Status](https://github.com/toshihikojs/sql-utils/actions/workflows/node.js.yml/badge.svg)](https://github.com/toshihikojs/sql-utils/actions/workflows/node.js.yml)
[![Coverage Status](https://coveralls.io/repos/github/toshihikojs/sql-utils/badge.svg?branch=master)](https://coveralls.io/github/toshihikojs/sql-utils?branch=master)

SQL string utils for Toshihiko.js.

## Description

This package provides utilities for processing SQL strings, including mapping SQL column names to new names using a provided map, escaping SQL strings, and escaping strings for SQL LIKE clauses.

## Features

- SQL column name mapping
- SQL string escaping
- SQL LIKE clause escaping

## Installation

To install this package, run:

```bash
npm install --save @toshihiko/sql-utils
```

## Usage

### Mapping SQL Column Names

You can use the `sqlNameToColumn` function to map SQL column names to new names using a provided map. Here is an example:

```typescript
import { sqlNameToColumn } from '@toshihiko/sql-utils';

const sql = 'SELECT aa FROM b WHERE cc = dd';
const map = {
  aa: 'a',
  cc: 'c',
  dd: 'd',
};

const newSql = sqlNameToColumn(sql, map);
console.log(newSql); // Output: SELECT a FROM b WHERE c = d
```

### Escaping SQL Strings

Use the `escape` function to escape special characters in a string to prevent SQL injection:

```typescript
import { escape } from '@toshihiko/sql-utils';

const userInput = 'It\'s a "quoted" string';
const escapedString = escape(userInput);
console.log(escapedString); // Output: It\'s a \"quoted\" string
```

### Escaping Strings for SQL LIKE Clauses

Use the `escapeLike` function to escape special wildcard characters used in SQL LIKE clauses:

```typescript
import { escapeLike } from '@toshihiko/sql-utils';

const searchTerm = '50%_discount';
const escapedTerm = escapeLike(searchTerm);
console.log(escapedTerm); // Output: 50\%\_discount
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
