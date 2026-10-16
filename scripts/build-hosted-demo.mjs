import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

// Keep the deployed form and its Worker in the same mode. This configuration
// contains only public settings; TURNSTILE_SECRET stays in Cloudflare secrets.
const config=JSON.parse(fs.readFileSync(new URL('../wrangler.demo.jsonc',import.meta.url),'utf8'));
const vars=config.vars;
if(!['live','simulated'].includes(vars.INQUIRY_MODE))throw Error('Explicit inquiry mode required');
if(vars.INQUIRY_MODE==='live'&&(vars.MAIL_PROVIDER!=='cloudflare'||!vars.MAIL_FROM||!config.send_email?.some(b=>b.name==='INQUIRY_EMAIL'&&b.destination_address==='theautovos@gmail.com')))throw Error('Live preview requires its restricted email binding and verified sender');
execFileSync(process.execPath,['scripts/build-site.mjs','--hosted-demo',...(vars.INQUIRY_MODE==='live'?['--live-inquiries']:[])],{stdio:'inherit',env:{...process.env,SITE_ORIGIN:vars.SITE_ORIGIN,TURNSTILE_SITE_KEY:vars.TURNSTILE_SITE_KEY||''}});
