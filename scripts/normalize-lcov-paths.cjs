'use strict';

const { readFileSync, writeFileSync } = require('node:fs');
const { join, relative, sep } = require('node:path');

const root = join(__dirname, '..');
const packages = [
  'packages/toshihiko',
  'packages/base-adapter',
  'packages/mysql-adapter',
  'packages/base-cache',
  'packages/redis',
  'packages/memcached',
  'packages/sql-utils',
];

for (const packageDirectory of packages) {
  const report = join(root, packageDirectory, 'coverage', 'lcov.info');
  const prefix = `${packageDirectory}/`;
  const normalized = readFileSync(report, 'utf8').replace(
    /^SF:(.+)$/gm,
    (_line, source) => {
      const repositoryPath = source.startsWith(prefix)
        ? source
        : `${prefix}${source}`;
      return `SF:${repositoryPath.split(sep).join('/')}`;
    },
  );
  writeFileSync(report, normalized);
  console.log(relative(root, report));
}
