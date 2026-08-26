# SQL Keywords Extraction

This directory contains the necessary files to extract MySQL keywords and reserved words from an HTML file and generate
a TypeScript file containing these keywords.

## Files

- `extract.ts`: A TypeScript script that parses the `keywords.html` file, extracts the MySQL keywords and reserved
  words, and generates the `src/keywords.ts` file.
- `keywords.html`: An HTML file containing the MySQL keywords and reserved words. This file is sourced from [MySQL 9.0
  Reference Manual](https://dev.mysql.com/doc/refman/9.0/en/keywords.html).

## How to Generate `keywords.ts`

To generate the `src/keywords.ts` file, follow these steps:

1. Ensure you have the necessary dependencies installed. If not, run:
   ```bash
   npm install
   ```

2. Run the `extract.ts` script using `ts-node`:
   ```bash
   npx ts-node tools/keywords/extract.ts
   ```

This will parse the `keywords.html` file, extract the keywords, and generate the `src/keywords.ts` file with the
extracted keywords.

## Source of `keywords.html`

The `keywords.html` file is sourced from the
[MySQL 9.0 Reference Manual](https://dev.mysql.com/doc/refman/9.0/en/keywords.html). It contains the list of MySQL
keywords and reserved words used for the extraction process.
