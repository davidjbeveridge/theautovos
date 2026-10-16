import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
export function launchGaps(checklist, publicKey) {
  if (checklist.schemaVersion !== 2 || !Array.isArray(checklist.records) || !checklist.records.length) return ['Missing evidence-backed launch records'];
  const ids = new Set();
  const missing = [];
  for (const row of checklist.records) {
    if (!row.id || ids.has(row.id) || !row.owner || !row.evidence || !Number.isFinite(Date.parse(row.checkedAt)) || typeof row.requiredForLaunch !== 'boolean' || !['ready','blocked','deferred','verified_complete'].includes(row.status)) missing.push('Invalid launch record: ' + (row.id || 'unnamed'));
    ids.add(row.id);
    if (row.requiredForLaunch && row.status !== 'verified_complete') missing.push(row.id + ': ' + (row.missingPrerequisite || 'verification evidence still required'));
  }
  for (const id of ['payment','acceptance','approved_media','production_intake_configuration','actual_inbox_receipt','privacy','dns_snapshot','shop_continuity','analytics_search','rollback','route_inventory']) {
    if (!checklist.records.some(r => r.id === id && r.requiredForLaunch)) missing.push('Required gate missing: ' + id);
  }
  if (!publicKey) missing.push('Public TURNSTILE_SITE_KEY build configuration');
  return missing;
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const missing = launchGaps(JSON.parse(fs.readFileSync('handoff/launch-checklist.json')), process.env.TURNSTILE_SITE_KEY);
  if (missing.length) {console.error('Launch blocked. Unresolved gates:\n' + missing.map(x => '- ' + x).join('\n')); process.exitCode = 1;}
  else console.log('Recorded launch prerequisites satisfied. This command does not deploy or grant release authority.');
}
