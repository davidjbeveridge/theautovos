// Static rendering keeps outgoing-link behavior available without JavaScript.
export function externalLinks(html, origin = 'https://www.theautovos.com') {
  return html.replace(/<a\b[^>]*>/gi, tag => {
    const href = tag.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2];
    if (!href || !/^(?:https?:)?\/\//i.test(href)) return tag;
    const url = new URL(href.replaceAll('&amp;', '&'), origin);
    // The service site and merchandise store are one visitor journey, even
    // though they have different hosts. Never force that navigation into a
    // new tab or make it depend on a Referer header.
    if (['theautovos.com', 'www.theautovos.com', 'shop.theautovos.com'].includes(url.hostname) && !url.port) {
      tag = tag.replace(/\s+target\s*=\s*(["']).*?\1/gi, '')
        .replace(/\s+aria-description\s*=\s*(["'])Opens in a new tab\1/gi, '');
      return tag.replace(/\s+rel\s*=\s*(["'])(.*?)\1/gi, (_, quote, value) => {
        const remaining = value.split(/\s+/).filter(v => v && !['noopener', 'noreferrer'].includes(v.toLowerCase()));
        return remaining.length ? ` rel=${quote}${remaining.join(' ')}${quote}` : '';
      });
    }
    if (url.origin === new URL(origin).origin) return tag;
    const rel = tag.match(/\brel\s*=\s*(["'])(.*?)\1/i)?.[2] || '';
    const relations = [...new Set([...rel.split(/\s+/).filter(Boolean), 'noopener', 'noreferrer'])].join(' ');
    tag = tag.replace(/\s+(?:target|rel|aria-description)\s*=\s*(["']).*?\1/gi, '');
    return tag.replace(/>$/, ` target="_blank" rel="${relations}" aria-description="Opens in a new tab">`);
  });
}
