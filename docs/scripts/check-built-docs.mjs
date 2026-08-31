import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = join(docsRoot, '.vitepress', 'dist');
const outputs = [
  { locale: 'en', directory: 'typedoc' },
  { locale: 'zh', directory: join('zh', 'typedoc') },
  { locale: 'ja', directory: join('ja', 'typedoc') },
];
const requiredPages = [
  'index.html',
  join('interfaces', 'toshihiko.Yukari.html'),
  join('classes', 'toshihiko.Toshihiko.html'),
];
const failures = [];

for (const output of outputs) {
  for (const page of requiredPages) {
    const path = join(outputRoot, output.directory, page);
    if (!existsSync(path)) failures.push(`${output.locale}: missing ${page}`);
  }

  const indexPath = join(outputRoot, output.directory, 'index.html');
  if (!existsSync(indexPath)) continue;

  const index = readFileSync(indexPath, 'utf8');
  if (!index.includes(`lang="${output.locale}"`)) {
    failures.push(`${output.locale}: incorrect HTML language`);
  }
  if (!index.includes('assets/custom.css?v=')) {
    failures.push(`${output.locale}: theme CSS is missing a content fingerprint`);
  }
  if (!index.includes('assets/custom.js?v=')) {
    failures.push(`${output.locale}: theme script is missing a content fingerprint`);
  }
}

if (failures.length > 0) {
  console.error('Built documentation checks failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Checked English, Chinese, and Japanese TypeDoc output.');
}
