// The old Squarespace primary-domain 301 can survive a DNS cutover in a
// visitor's browser. Shop links use a fresh query URL to avoid that entry.
(async () => {
 const url = new URL(location.href);
 if (url.pathname !== '/' || url.searchParams.get('from') !== 'shop') return;
 try {
  // Replace the cached redirect with the current homepage response. Unlike
  // no-store, reload both bypasses the old entry and updates the HTTP cache.
  const response = await fetch('/', {cache:'reload', mode:'same-origin', redirect:'error'});
  if (response.status !== 200 || !response.headers.get('content-type')?.includes('text/html')) return;
  await response.arrayBuffer();
  url.searchParams.delete('from');
  history.replaceState(history.state, '', url.href);
 } catch {
  // The fresh landing URL remains usable if the repair request fails.
 }
})();
