import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packagesRoot = resolve(docsRoot, '..', 'packages');
const locales = ['zh', 'ja'];

function markdownFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'public') {
      return [];
    }

    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return markdownFiles(path);
    }

    return entry.isFile() && entry.name.endsWith('.md') ? [path] : [];
  });
}

function typescriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (
      entry.name === 'node_modules'
      || entry.name === 'lib'
      || entry.name === 'dist'
      || entry.name === 'coverage'
    ) {
      return [];
    }

    const path = join(directory, entry.name);
    if (entry.isDirectory()) return typescriptFiles(path);
    return entry.isFile() && entry.name.endsWith('.ts') ? [path] : [];
  });
}

const allPages = markdownFiles(docsRoot);
const rootPages = allPages
  .map((path) => relative(docsRoot, path))
  .filter((path) => !locales.some((locale) => path.startsWith(`${locale}${sep}`)))
  .filter((path) => path !== 'README.md')
  .sort();

const failures = [];
let trilingualComments = 0;

for (const locale of locales) {
  const localizedPages = allPages
    .map((path) => relative(join(docsRoot, locale), path))
    .filter((path) => !path.startsWith(`..${sep}`))
    .sort();

  for (const page of rootPages) {
    if (!localizedPages.includes(page)) {
      failures.push(`${locale}: missing ${page}`);
    }
  }

  for (const page of localizedPages) {
    if (!rootPages.includes(page)) {
      failures.push(`${locale}: unexpected page without an English counterpart: ${page}`);
    }
  }
}

const markdownLink = /\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;

for (const page of allPages) {
  const source = readFileSync(page, 'utf8');
  for (const match of source.matchAll(markdownLink)) {
    const href = match[1];
    if (
      href.startsWith('#') ||
      href.startsWith('/') ||
      /^[a-z][a-z\d+.-]*:/i.test(href)
    ) {
      continue;
    }

    const pathname = decodeURIComponent(href.split(/[?#]/, 1)[0]);
    if (!pathname) {
      continue;
    }

    const target = resolve(dirname(page), pathname);
    const candidates = extname(target)
      ? [target]
      : [target, `${target}.md`, join(target, 'index.md')];
    const found = candidates.some((candidate) => existsSync(candidate) && statSync(candidate).isFile());

    if (!found) {
      failures.push(`${relative(docsRoot, page)}: broken link ${href}`);
    }
  }
}

for (const path of typescriptFiles(packagesRoot)) {
  const source = readFileSync(path, 'utf8');
  for (const match of source.matchAll(/\/\*\*[\s\S]*?\*\//g)) {
    const comment = match[0];
    if (comment.includes('@internal')) continue;
    if (!/^\s*\*\s+\S/m.test(comment)) continue;

    const missing = locales.filter((locale) => !comment.includes(`@${locale}`));
    if (missing.length > 0) {
      const line = source.slice(0, match.index).split('\n').length;
      failures.push(
        `${relative(packagesRoot, path)}:${line}: missing ${missing.map((locale) => `@${locale}`).join(' and ')}`,
      );
    } else {
      trilingualComments += 1;
    }
  }
}

if (failures.length > 0) {
  console.error('Documentation checks failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Checked ${rootPages.length} pages and ${trilingualComments} source comments across English, Chinese, and Japanese.`,
  );
}
