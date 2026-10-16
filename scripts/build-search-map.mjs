import fs from 'node:fs';
import {routeRegistry} from '../src/site/routes.mjs';
const lines=['# Current page and keyword map','','Generated from design/page-inventory.json. Rebuild with node scripts/build-search-map.mjs whenever routes or targets change. Historical DataForSEO evidence remains dated October 7–8, 2026; unavailable estimates are not zero demand. Exterior windshield protection film and interior windshield tint are separate intents. No new demand estimates are invented.',''];
for(const r of routeRegistry)lines.push(`- [${r.title}](https://7c4e9a.demos.beveridge.io${r.path}) — ${r.primaryKeyword||'Navigation / evidence; no demand forecast'}. Supporting: ${(r.supportingKeywords||[]).join('; ')||'none'}.`);
fs.mkdirSync('handoff',{recursive:true});fs.writeFileSync('handoff/search-map.md',lines.join('\n')+'\n');
console.log(`${routeRegistry.length} canonical page targets written.`);
