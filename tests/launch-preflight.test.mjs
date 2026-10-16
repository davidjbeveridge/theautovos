import {test} from 'node:test';
import assert from 'node:assert/strict';
import {launchGaps} from '../scripts/launch-preflight.mjs';
const required = ['payment','acceptance','approved_media','production_intake_configuration','actual_inbox_receipt','privacy','dns_snapshot','shop_continuity','analytics_search','rollback','route_inventory'];
const checklist = () => ({schemaVersion: 2, records: required.map(id => ({id, status: 'verified_complete', owner: 'David', evidence: 'Verified test evidence', checkedAt: '2026-10-15T20:00:00Z', requiredForLaunch: true}))});
test('deferred owner content does not block verified launch gates', () => {
  const data = checklist();
  data.records.push({id: 'later_terms', status: 'deferred', owner: 'Caleb', evidence: 'Explicit deferral', checkedAt: '2026-10-15T20:00:00Z', requiredForLaunch: false});
  assert.deepEqual(launchGaps(data, 'public-test-key'), []);
});
test('provider acceptance cannot substitute for an inbox receipt', () => {
  const data = checklist();
  data.records.find(r => r.id === 'actual_inbox_receipt').status = 'ready';
  assert(launchGaps(data, 'public-test-key').some(x => x.startsWith('actual_inbox_receipt:')));
});
test('missing, malformed or demoted required records fail closed', () => {
  for (const alter of [d => d.records.shift(), d => d.records[0].requiredForLaunch = false, d => d.records[0].evidence = '', d => d.records[0].checkedAt = 'not-a-date']) {
    const data = checklist(); alter(data); assert(launchGaps(data, 'public-test-key').length);
  }
  assert(launchGaps({}, null).length);
  assert(launchGaps(checklist(), '').length);
});
