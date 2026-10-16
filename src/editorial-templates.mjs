import {readFileSync} from 'node:fs';
import {layout, invitation, escape as e, button} from './components.mjs';
import {splitHeader, editorialRows} from './editorial.mjs';
import {guideSections} from './site/guide-media.mjs';

const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const approved = read('./site/approved-media.json');
const galleries = read('./site/galleries.json');
const guides = read('./site/resource-guides.json');
const relative = html => html.replaceAll('="/assets/', '="../assets/');
const preview = 'https://7c4e9a.demos.beveridge.io';

const workRows = galleries.map(g => ({title: g.title, text: g.description, href: preview + '/gallery' + g.path + '/', image: g.images[0], caption: g.images[0].caption, action: 'View the installation gallery'}));
const workFilters = ['All', ...galleries.map(g => g.title)];
const workEntries = editorialRows(workRows).replace('class="site-editorial-rows"', 'class="site-editorial-rows" data-gallery-grid').replace(/<article class="site-editorial-row" data-row="(\d+)"/g, (_, n) => `<article class="site-editorial-row" data-category="${e(workRows[Number(n) - 1].title)}" data-row="${n}"`);
export const workTemplate = layout('Our work', relative(splitHeader({label: 'Our work', title: 'See the work up close.', description: 'Real film installations, finished vehicles and details from our Colorado Springs studio.', image: approved.purpose}) + `<section class="av-section"><div class="av-frame"><div class="av-filter-bar" role="group" aria-label="Filter work">${workFilters.map((name, i) => `<button class="av-filter" data-filter="${e(name)}" aria-pressed="${i === 0}">${e(name)}</button>`).join('')}</div><p class="av-result-count" role="status" data-result-count>4 galleries</p></div>${workEntries}<div class="av-frame av-empty" data-gallery-empty hidden><h2>No matching galleries.</h2><p>See the full installation collection.</p>${button('Show all work', 'data-reset-gallery')}</div></section>`) + invitation(), {active: 'work'});

const comparison = guides.find(g => g.slug === 'ppf-vs-ceramic-coating');
export const guideTemplate = layout(comparison.title, relative(splitHeader({label: 'Guides & questions', title: comparison.title, description: comparison.description, image: approved.ppfCard}) + `<article class="av-frame av-section">${guideSections(comparison)}<aside><h2>Further reading</h2><ul>${comparison.sources.map(s => `<li><a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.label)}</a></li>`).join('')}</ul></aside><p><a href="guides.html">Back to the guides</a></p></article>`) + invitation('Tell us what you want to protect.', 'Share your car, how you drive and the panels you want protected. We’ll discuss film, coating and the cost with you.'));

const guideRows = [
  {title: comparison.title, text: comparison.description, image: approved.ppfExplanation, href: 'story.html'},
  {title: 'How much does window tint cost?', text: 'See how glass coverage, film choice and preparation affect your quote.', image: approved.tintCard, href: preview + '/resources/window-tint-cost-colorado-springs/'},
  {title: 'Watch a Porsche 997 fender installation', text: 'Follow the video, exact stills and quality checks through the installation.', image: {src: '/assets/fender-guide/step-03.jpg', alt: 'Auto Vos fitting film around a Porsche 997 front fender', width: 1280, height: 720}, href: preview + '/resources/porsche-997-front-fender-ppf-installation/'}
];
export const guidesTemplate = layout('Vehicle protection guides', relative(splitHeader({label: 'Guides & questions', title: 'Before you decide.', description: 'Understand the products, compare your options and watch real installations.', image: approved.ppfCard}) + `<section class="av-section">${editorialRows(guideRows)}</section>`) + invitation());
