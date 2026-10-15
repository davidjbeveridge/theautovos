import {escape as e} from './components.mjs';

function imageMarkup(image, {className = '', loading = 'lazy', decoding = 'async'} = {}) {
  if (!image?.src || !image?.alt) throw new TypeError('Editorial images need a source and descriptive alt text.');
  const width = Number(image.width) || 1280;
  const height = Number(image.height) || 800;
  return `<img class="${e(className)}" src="${e(image.src)}" alt="${e(image.alt)}" title="${e(image.title || image.alt)}" width="${width}" height="${height}" loading="${loading}" decoding="${decoding}">`;
}

export function splitHeader({label, title, description, image, className = '', headingLevel = 1}) {
  if (!label || !title || !description) throw new TypeError('Split headers need a label, title and description.');
  const level = Math.max(1, Math.min(6, Number(headingLevel) || 1));
  return `<header class="site-split-header${className ? ` ${e(className)}` : ''}"><div class="site-split-header__copy"><p class="av-eyebrow">${e(label)}</p><h${level} class="av-display">${e(title).replaceAll('\n', '<br>')}</h${level}><p class="av-lead">${e(description)}</p></div><div class="site-split-header__media">${imageMarkup(image, {className: 'av-image', loading: 'eager'})}</div></header>`;
}

export function editorialRows(rows, {className = ''} = {}) {
  return `<div class="site-editorial-rows${className ? ` ${e(className)}` : ''}">${rows.map((row, index) => {
    const title = row.href ? `<a href="${e(row.href)}">${e(row.title)}</a>` : e(row.title);
    const media = imageMarkup(row.image, {className: 'av-image'});
    const linkedMedia = row.href ? `<a class="site-editorial-row__image-link" href="${e(row.href)}" aria-label="${e(row.imageLinkLabel || `Read ${row.title}`)}">${media}</a>` : media;
    const lead = row.lead ? `<p class="site-editorial-row__lead"><strong>${e(row.lead)}</strong></p>` : '';
    const text = row.text ? `<p>${e(row.text)}</p>` : '';
    const caption = row.caption ? `<p class="av-caption">${e(row.caption)}</p>` : '';
    return `<article class="site-editorial-row" data-row="${index + 1}"><div class="site-editorial-row__copy"><h2>${title}</h2>${lead}${text}${row.href ? `<a class="site-text-link" href="${e(row.href)}">${e(row.action || 'Read the guide')} →</a>` : ''}</div><figure class="site-editorial-row__media">${linkedMedia}${caption}</figure></article>`;
  }).join('')}</div>`;
}

export function mediaExplanation({title, text, image, caption = '', lightboxLabel, className = ''}) {
  if (!title || !text) throw new TypeError('Media explanations need a title and explanatory text.');
  const src = e(image?.src || '');
  const label = e(lightboxLabel || `Enlarge: ${image?.alt || title}`);
  const img = imageMarkup(image, {className: 'av-image'});
  return `<section class="site-media-explanation${className ? ` ${e(className)}` : ''}"><div class="site-media-explanation__copy"><h3>${e(title)}</h3><p>${e(text)}</p></div><figure class="site-media-explanation__media"><a data-lightbox href="${src}" aria-label="${label}">${img}</a>${caption ? `<figcaption class="av-caption">${e(caption)} <a href="${src}">Open full-size image</a></figcaption>` : `<figcaption class="av-caption"><a href="${src}">Open full-size image</a></figcaption>`}</figure></section>`;
}
