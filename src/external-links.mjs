// Static rendering keeps outgoing-link behavior available without JavaScript.
export function externalLinks(html, origin = 'https://www.theautovos.com') {
  return html.replace(/<a\b[^>]*>/gi, tag => {
    const href = tag.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2];
    if (!href || !/^(?:https?:)?\/\//i.test(href)) return tag;
    const url = new URL(href.replaceAll('&amp;', '&'), origin);
    const legacyShop = /^(?:www\.)?theautovos\.com$/.test(url.hostname) && /^\/shop(?:\/|$)/.test(url.pathname);
    if (url.origin === new URL(origin).origin && !legacyShop) return tag;
    const rel = tag.match(/\brel\s*=\s*(["'])(.*?)\1/i)?.[2] || '';
    const relations = [...new Set([...rel.split(/\s+/).filter(Boolean), 'noopener', 'noreferrer'])].join(' ');
    tag = tag.replace(/\s+(?:target|rel|aria-description)\s*=\s*(["']).*?\1/gi, '');
    return tag.replace(/>$/, ` target="_blank" rel="${relations}" aria-description="Opens in a new tab">`);
  });
}
