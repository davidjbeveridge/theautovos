import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

// Publish only the owner-facing site. Internal source, audits and tools stay out.
const destination = 'dist';
const allowed = ['index.html', 'styles.css', 'app.js', 'robots.txt', '.nojekyll', 'assets', 'design-system', 'templates'];
fs.rmSync(destination, {recursive: true, force: true});
fs.mkdirSync(destination);
for (const file of allowed) fs.cpSync(file, path.join(destination, file), {recursive: true});
const walk = dir => fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
  const file = path.join(dir, entry.name);
  assert.ok(!entry.isSymbolicLink(), `Symlink in preview: ${file}`);
  return entry.isDirectory() ? walk(file) : [file];
});
const files = walk(destination);
const retired = new Set(['ppf-installation.webp', 'shop-film.mp4', 'shop-film-mobile.mp4']);
assert.ok(!files.some(file => retired.has(path.basename(file))), 'Retired media must not be published');
for (const file of files.filter(file => file.endsWith('.html'))) {
  const html = fs.readFileSync(file, 'utf8');
  assert.ok(!/\b(?:jacques|xenia|strict-simple)\b/i.test(html), `Internal tooling leaked into ${file}`);
  for (const [, target] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
    if (/^(?:https?:|tel:|mailto:|data:|#)/.test(target)) continue;
    const local = path.resolve(path.dirname(file), target.split(/[?#]/)[0]);
    assert.ok(local.startsWith(path.resolve(destination) + path.sep), `Link escapes preview: ${target}`);
    assert.ok(fs.existsSync(local), `Missing published target: ${file} -> ${target}`);
  }
}
const revision = execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
fs.writeFileSync(path.join(destination, 'preview-version.json'), JSON.stringify({revision, status: 'owner-review', canonicalDesign: 'design-system/'}, null, 2) + '\n');
console.log(`Packaged ${files.length} owner-facing files; internal documentation excluded.`);
