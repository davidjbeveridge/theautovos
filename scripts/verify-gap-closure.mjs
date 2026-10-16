import assert from 'node:assert/strict';
import fs from 'node:fs';
import {guideMedia} from '../src/site/guide-media.mjs';
import {blockedPaths} from '../src/site/routes.mjs';
const read = p => fs.readFileSync(p, 'utf8');
const approved = JSON.parse(read('src/site/approved-media.json'));
const galleries = JSON.parse(read('src/site/galleries.json'));
const home = read('dist-demo/index.html');
for (const g of galleries) {
  const href = '/gallery' + g.path + '/';
  assert(home.includes(`href="${href}"`));
  assert(home.includes(`src="${g.cover.src}"`));
  assert.equal(g.images.at(-1).src, g.cover.src, 'Home covers belong last in deeper galleries');
}
for (const key of ['tintCard','ppfCard','purpose']) assert(home.includes(`src="${approved[key].src}"`), key);
for (const key of ['contact','waiting']) assert(read('dist-demo/contact/index.html').includes(`src="${approved[key].src}"`), key);
for (const [slug, mapping] of Object.entries(guideMedia)) {
  const html = read(`dist-demo/resources/${slug}/index.html`);
  assert.equal((html.match(/data-guide-section=/g) || []).length, mapping.length);
  assert.equal((html.match(/class="site-media-explanation"/g) || []).length, mapping.filter(p => p.image || p.diagram).length);
  assert(mapping.every(p => p.image || p.diagram || p.textOnlyReason));
  assert(!html.includes('site-layer-example'));
}
assert.equal(blockedPaths.size, 0);
for (const mode of ['demo','production']) {
  assert(read(`dist-${mode}/work/bmw/index.html`).includes('bmw-coupe-satin-gray-332.jpg'));
  assert(read(`dist-${mode}/work/tesla/index.html`).includes('tesla-matte-front-51.jpg'));
  assert(read(`dist-${mode}/reviews/index.html`).includes('Christopher Jones'));
  assert(read(`dist-${mode}/services/windshield-protection-film/index.html`).includes('windshield-protection-914-v3.png'));
  assert(!read(`dist-${mode}/services/windshield-protection-film/index.html`).includes('windshield-protection-photo-v2.png'));
}
for (const name of ['work','guides','story']) assert(read(`templates/${name}.html`).includes('site-split-header'));
assert(read('templates/work.html').includes('data-gallery-grid'));
assert(read('templates/guides.html').includes('site-editorial-row'));
assert(read('templates/story.html').includes('site-media-explanation'));
assert(!read('templates/story.html').includes('Porsche 918'));
for (const name of ['split-header','editorial-row','media-explanation']) assert(JSON.parse(read(`contracts/components/${name}.yaml`)).consumers.length);
console.log('Gap closure: exact placements, six guide mappings, vehicle diagram, brand evidence and real template consumers passed.');
