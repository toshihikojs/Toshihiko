'use strict';

const { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const output = join(root, 'common', 'temp', 'coverage-site');
const packages = [
  { directory: 'packages/toshihiko', name: 'toshihiko', slug: 'toshihiko' },
  { directory: 'packages/base-adapter', name: '@toshihiko/base-adapter', slug: 'base-adapter' },
  { directory: 'packages/mysql-adapter', name: '@toshihiko/mysql-adapter', slug: 'mysql-adapter' },
  { directory: 'packages/base-cache', name: '@toshihiko/base-cache', slug: 'base-cache' },
  { directory: 'packages/redis', name: '@toshihiko/redis-cache', slug: 'redis-cache' },
  { directory: 'packages/memcached', name: '@toshihiko/memcached-cache', slug: 'memcached-cache' },
  { directory: 'packages/sql-utils', name: '@toshihiko/sql-utils', slug: 'sql-utils' },
];

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function badge(value) {
  const label = 'coverage';
  const message = `${value}%`;
  const labelWidth = 63;
  const messageWidth = Math.max(45, message.length * 7 + 12);
  const width = labelWidth + messageWidth;
  const color = value === 100 ? '#4c1' : value >= 90 ? '#97ca00' : value >= 80 ? '#a4a61d' : '#e05d44';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${label}: ${message}">
  <title>${label}: ${message}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${width}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${messageWidth}" height="20" fill="${color}"/>
    <rect width="${width}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + messageWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${message}</text>
    <text x="${labelWidth + messageWidth / 2}" y="14">${message}</text>
  </g>
</svg>
`;
}

function page(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
    body { margin: 0 auto; max-width: 960px; padding: 48px 24px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border-bottom: 1px solid #8885; padding: 12px; text-align: left; }
    a { color: inherit; }
    img { vertical-align: middle; }
  </style>
</head>
<body>
${body}
</body>
</html>
`;
}

rmSync(output, { force: true, recursive: true });
mkdirSync(join(output, 'coverage'), { recursive: true });

const summaries = packages.map(packageInfo => {
  const coverageDirectory = join(root, packageInfo.directory, 'coverage');
  const summary = JSON.parse(readFileSync(join(coverageDirectory, 'coverage-summary.json'), 'utf8')).total;
  const packageOutput = join(output, 'coverage', packageInfo.slug);
  mkdirSync(packageOutput, { recursive: true });
  cpSync(join(coverageDirectory, 'lcov-report'), packageOutput, { recursive: true });
  writeFileSync(join(packageOutput, 'badge.svg'), badge(summary.lines.pct));
  writeFileSync(join(packageOutput, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  return { ...packageInfo, summary };
});

const rows = summaries.map(({ name, slug, summary }) => `
    <tr>
      <td><a href="./${slug}/">${escapeHtml(name)}</a></td>
      <td><img src="./${slug}/badge.svg" alt="${escapeHtml(name)} coverage"></td>
      <td>${summary.statements.pct}%</td>
      <td>${summary.branches.pct}%</td>
      <td>${summary.functions.pct}%</td>
      <td>${summary.lines.pct}%</td>
    </tr>`).join('');

writeFileSync(join(output, 'coverage', 'index.html'), page('Toshihiko coverage', `<h1>Toshihiko coverage</h1>
<p>Coverage reports generated from the latest successful CI run on the v2 branch.</p>
<table>
  <thead><tr><th>Package</th><th>Coverage</th><th>Statements</th><th>Branches</th><th>Functions</th><th>Lines</th></tr></thead>
  <tbody>${rows}
  </tbody>
</table>`));

writeFileSync(join(output, 'index.html'), page('Toshihiko', '<h1>Toshihiko</h1>\n<p><a href="./coverage/">Package coverage reports</a></p>'));

for (const { name, summary } of summaries) {
  console.log(`${name}: statements ${summary.statements.pct}%, branches ${summary.branches.pct}%, functions ${summary.functions.pct}%, lines ${summary.lines.pct}%`);
}
