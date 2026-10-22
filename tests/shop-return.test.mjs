import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../src/site/shop-return.js', import.meta.url), 'utf8');
async function run(href, response = new Response('<html>Home</html>', {headers:{'content-type':'text/html'}})) {
 const calls = [], history = {state:{existing:true}, replaceState(...args) {calls.push(['history', ...args]);}};
 await vm.runInNewContext(source, {URL, location:{href}, history, fetch:async (...args) => {
  calls.push(['fetch', ...args]);
  if (response instanceof Error) throw response;
  return response;
 }});
 return calls;
}
test('shop return refreshes the old redirect entry before restoring the clean URL', async () => {
 const calls = await run('https://theautovos.com/?from=shop&utm_source=merch#services');
 assert.equal(calls[0][1], '/');
 assert.deepEqual(JSON.parse(JSON.stringify(calls[0][2])), {cache:'reload', mode:'same-origin', redirect:'error'});
 assert.equal(calls[1][1].existing, true);
 assert.equal(calls[1][3], 'https://theautovos.com/?utm_source=merch#services');
});
test('ordinary visits do not fetch again or change history', async () => {
 for (const href of ['https://theautovos.com/', 'https://theautovos.com/?from=search', 'https://theautovos.com/contact/?from=shop']) assert.deepEqual(await run(href), []);
});
test('failed, redirected or non-HTML refreshes retain the usable fresh landing URL', async () => {
 for (const response of [new Error('offline'), new Response('', {status:302}), new Response('Unavailable', {status:503}), new Response('{}', {headers:{'content-type':'application/json'}})]) {
  const calls = await run('https://theautovos.com/?from=shop', response);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'fetch');
 }
});
