import {readFileSync} from 'node:fs';
import {escape as e} from '../components.mjs';
import {mediaExplanation, textWithSources} from '../editorial.mjs';
import {diagrams} from './service-media.mjs';

const approved = JSON.parse(readFileSync(new URL('./approved-media.json', import.meta.url)));
const galleries = JSON.parse(readFileSync(new URL('./galleries.json', import.meta.url)));
const photo = src => galleries.flatMap(g => g.images).find(im => im.src.endsWith(src));
const textOnly = reason => ({textOnlyReason: reason});

// One entry for every section, in reading order. Use media to explain the point,
// never as evidence of a measurement, damage or product we have not verified.
export const guideMedia = {
  'colorado-window-tint-laws': [
    {diagram: 'tint'},
    {image: photo('dark-cabin-dashboard-detail.jpg'), caption: 'A view of the cabin and glass from Caleb’s tint folder. A photograph cannot establish legal light transmission.'},
    textOnly('No verified meter photograph or measurement is available; preserve the measurement explanation without implying a test.'),
    textOnly('The quote checklist is clearer as text.')
  ],
  'window-tint-cost-colorado-springs': [
    {image: photo('hero-window-tint-installation.jpg')},
    {diagram: 'tint'},
    textOnly('No approved photograph shows old-film removal; do not repurpose a fitting photograph as removal evidence.'),
    textOnly('Keep the short quote checklist and its action together.')
  ],
  'ppf-cost-guide': [
    {image: approved.ppfCard},
    {diagram: 'ppf'},
    {image: approved.ceramicSupport[1], caption: 'Polishing a red car at Auto Vos. Preparation is separate from installing film; this photo does not show PPF being applied.'},
    textOnly('The itemized quote checklist needs no decorative image.')
  ],
  'ppf-vs-ceramic-coating': [
    {diagram: 'ppf'}, {diagram: 'ceramic'}, {diagram: 'combination'},
    textOnly('Coverage depends on the customer’s priorities; the preceding three diagrams explain the physical differences.')
  ],
  'ceramic-vs-carbon-tint': [
    {diagram: 'tint', caption: 'Ceramic window-film illustration, not a carbon-film cross-section. Both types are compared by the specifications of the actual film and shade; no carbon product is presented as an Auto Vos offering.'},
    textOnly('Use the linked manufacturer data; an invented comparison chart would imply unsupported product specifications.'),
    {image: photo('green-coupe-open-door-interior.jpg'), caption: 'Side glass and the cabin of a green coupe in Caleb’s tint photographs. Shade and visibility need to be considered together; the image does not measure heat rejection.'},
    textOnly('This answer distinguishes the confirmed offering from a comparison topic.')
  ],
  'does-ppf-protect-against-hail': [
    {diagram: 'ppf'},
    textOnly('No supplied photo documents hail damage or an impact test. Do not manufacture visual evidence.'),
    {image: photo('porsche-headlamp-opening-film-edge-9.jpg'), caption: 'Film being fitted around a Porsche headlamp opening. This is an installation detail, not hail damage or a storm repair; an installer must inspect the actual damage before deciding whether to replace film.'},
    textOnly('Keep the answer direct: PPF is not hail protection.')
  ]
};

export function guideSections(article) {
  const mapping = guideMedia[article.slug];
  if (!mapping || mapping.length !== article.sections.length) throw new Error(`Incomplete guide media mapping: ${article.slug}`);
  return article.sections.map((section, index) => {
    const sources = (section.sourceLinks || []).map(reference => {
      const source = article.sources.find(source => source.label === reference.source);
      if (!source) throw new Error(`Unknown guide source: ${reference.source}`);
      return {text: reference.text, url: source.url};
    });
    const placement = mapping[index];
    let image = placement.image;
    let caption = placement.caption || image?.caption;
    if (placement.diagram) {
      const diagram = diagrams[placement.diagram];
      image = {src: `/assets/diagrams/${diagram.file}.png`, alt: diagram.alt, title: diagram.title, width: 1448, height: 1086};
      caption = placement.caption || diagram.caption;
    }
    if (!image && !placement.textOnlyReason) throw new Error(`Missing media/reason: ${article.slug}:${index}`);
    const html = image
      ? mediaExplanation({title: section.title, text: section.text, image, caption, headingLevel: 2, sources})
      : `<section class="site-guide-prose__section"><h2>${e(section.title)}</h2><p>${textWithSources(section.text, sources)}</p></section>`;
    return html.replace('<section ', `<section data-guide-section="${index + 1}" `);
  }).join('');
}
