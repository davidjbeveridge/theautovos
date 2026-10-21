import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const config=JSON.parse(fs.readFileSync('wrangler.jsonc','utf8').replace(/^\s*\/\/.*$/gm,''));
assert.match(config.account_id,/^[a-f0-9]{32}$/,'Verify and bind the new admin@makelark.com account before deployment');
assert(!['2e778d60d9f80f40c6af6f499c52acc8','efdb13d2d6f8a0124f0ec3d27cdd3aab'].includes(config.account_id),'Personal and OptionLab accounts are excluded from this production launch');
assert.equal(config.vars.SITE_ORIGIN,'https://theautovos.com');
assert.equal(config.vars.SHOP_URL,'https://shop.theautovos.com/');
assert.equal(config.vars.MAIL_PROVIDER,'cloudflare');
assert.match(config.vars.TURNSTILE_SITE_KEY,/^0x[A-Za-z0-9_-]+$/,'Configure the production Turnstile widget before deployment');
assert.deepEqual(config.send_email,[{name:'INQUIRY_EMAIL',allowed_destination_addresses:['theautovos@gmail.com']}]);
execFileSync(process.execPath,['scripts/build-site.mjs','--production'],{stdio:'inherit',env:{...process.env,...config.vars}});
