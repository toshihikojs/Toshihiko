import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = join(docsRoot, '.vitepress', 'dist');
const typeReferenceRoots = [
  join(outputRoot, 'typedoc'),
  join(outputRoot, 'zh', 'typedoc'),
  join(outputRoot, 'ja', 'typedoc'),
];

function files(directory, extension) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return files(path, extension);
    return entry.isFile() && entry.name.endsWith(extension) ? [path] : [];
  });
}

function fingerprint(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 12);
}

for (const root of typeReferenceRoots) {
  const versions = {
    css: fingerprint(join(root, 'assets', 'custom.css')),
    js: fingerprint(join(root, 'assets', 'custom.js')),
  };

  for (const path of files(root, '.html')) {
    const source = readFileSync(path, 'utf8');
    const finalized = source
      .replace(/assets\/custom\.css(?:\?v=[a-f\d]+)?/g, `assets/custom.css?v=${versions.css}`)
      .replace(/assets\/custom\.js(?:\?v=[a-f\d]+)?/g, `assets/custom.js?v=${versions.js}`);
    writeFileSync(path, finalized);
  }
}

console.log('Added content fingerprints to TypeDoc theme assets.');
