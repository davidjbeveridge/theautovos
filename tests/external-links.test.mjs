import test from 'node:test';
import assert from 'node:assert/strict';
import {externalLinks} from '../src/external-links.mjs';

test('outgoing web links open safely without altering local and native destinations', () => {
  for (const href of ['/about/', '#photos', 'tel:+17206758038', 'mailto:theautovos@gmail.com', '/assets/photo.jpg', 'https://www.theautovos.com/contact/']) {
    const html = `<a href="${href}">Visit</a>`;
    assert.equal(externalLinks(html), html);
  }
  for (const href of ['https://www.xpel.com/spec.pdf', 'https://www.instagram.com/theautovos/', '//www.google.com/maps', 'https://shop.theautovos.com.example.org/', 'https://theautovos.com@external.example/']) {
    const result = externalLinks(`<a href="${href}" target="_self" rel="nofollow">Visit</a>`);
    assert.match(result, /target="_blank"/);
    assert.match(result, /rel="nofollow noopener noreferrer"/);
    assert.match(result, /aria-description="Opens in a new tab"/);
    assert.equal(externalLinks(result), result);
  }
  const preview = 'https://7c4e9a.demos.beveridge.io';
  assert.doesNotMatch(externalLinks(`<a href="${preview}/work/">Work</a>`, preview), /target=/);
  assert.match(externalLinks('<a href="https://example.com" aria-label="Manufacturer" title="Product details">Details</a>'), /aria-label="Manufacturer" title="Product details"/);
});

test('main site and store links use native same-tab navigation in production and preview', () => {
  for (const origin of ['https://theautovos.com', 'https://www.theautovos.com', 'https://7c4e9a.demos.beveridge.io']) {
    for (const href of ['https://shop.theautovos.com/', '//shop.theautovos.com/shop/p/hat', 'https://theautovos.com/', 'https://www.theautovos.com/shop']) {
      const expected = `<a href="${href}" title="Auto Vos" aria-label="Shop">Visit</a>`;
      assert.equal(externalLinks(expected, origin), expected);
      const old = `<a href="${href}" title="Auto Vos" aria-label="Shop" target="_blank" rel="noopener noreferrer" aria-description="Opens in a new tab">Visit</a>`;
      assert.equal(externalLinks(old, origin), expected);
      assert.equal(externalLinks(externalLinks(old, origin), origin), expected);
    }
  }
  const html = '<a href="https://shop.theautovos.com/" rel="nofollow noopener noreferrer" aria-description="Auto Vos merchandise">Shop</a>';
  assert.equal(externalLinks(html), '<a href="https://shop.theautovos.com/" rel="nofollow" aria-description="Auto Vos merchandise">Shop</a>');
});
