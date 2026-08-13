// build-page.mjs — put the GATED seed check inside the page.
//
// A seed is a single offline file, so the kernel is inlined rather than imported. Inlined VERBATIM:
// if this script could edit the kernel on the way in, the thing that was gated and the thing that
// refuses your fork would be two different programs.
import { readFileSync, writeFileSync } from 'node:fs';

const OPEN = '/* __SEED_KERNEL__ */';
const CLOSE = '/* __END_SEED_KERNEL__ */';

// Only the export KEYWORD goes. The \r? matters: these files are CRLF and `.` stops at \r.
const kernel = readFileSync('seed.mjs', 'utf8')
  .replace(/^#!.*\r?\n/, '')
  .replace(/^import[^\n]*\n/gm, '')
  .replace(/^export default[\s\S]*?;\s*$/m, '')
  .replace(/^export (function|const|async function)/gm, '$1')
  .replace(/^export \{[^}]*\};?\s*$/gm, '');

const html = readFileSync('index.html', 'utf8');
const a = html.indexOf(OPEN), b = html.indexOf(CLOSE);
if (a < 0 || b < 0) throw new Error('the kernel markers are missing from index.html');

const out = html.slice(0, a + OPEN.length) + '\n' + kernel + '\n' + html.slice(b);
writeFileSync('index.html', out);

for (const fn of ['function validateSeed', 'function findSeedLiteral', 'function isPrime']) {
  if (!out.includes(fn)) throw new Error(`the page does not contain ${fn} — the inline did not take`);
}
if (/^export /m.test(out.slice(a, out.indexOf(CLOSE)))) throw new Error('module syntax survived into the page');
console.log(`index.html — seed check inlined, ${kernel.split('\n').length} lines, page ${(out.length / 1024).toFixed(0)}KB`);
