// Exports the screenshot attachments from docs/screenshots.xcresult into
// docs/screenshots/*.png, resized for the README. Run via `npm run screenshots`.
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const bundle = 'docs/screenshots.xcresult';
const out = 'docs/screenshots';
const tmp = 'docs/.attachments';
if (!existsSync(bundle)) throw new Error(`Missing ${bundle}`);
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
mkdirSync(out, { recursive: true });
execSync(`xcrun xcresulttool export attachments --path ${bundle} --output-path ${tmp}`, { stdio: 'ignore' });
const manifest = JSON.parse(readFileSync(join(tmp, 'manifest.json'), 'utf8'));
let count = 0;
for (const test of manifest) {
  for (const attachment of test.attachments ?? []) {
    const name = attachment.suggestedHumanReadableName ?? '';
    const match = name.match(/^(\d{2}-[a-z-]+)/);
    if (!match) continue;
    const target = join(out, `${match[1]}.png`);
    copyFileSync(join(tmp, attachment.exportedFileName), target);
    execSync(`sips --resampleWidth 540 "${target}" --out "${target}"`, { stdio: 'ignore' });
    count += 1;
  }
}
rmSync(tmp, { recursive: true, force: true });
rmSync(bundle, { recursive: true, force: true });
console.log(`Exported ${count} screenshots to ${out}`);
if (readdirSync(out).length === 0) process.exit(1);
