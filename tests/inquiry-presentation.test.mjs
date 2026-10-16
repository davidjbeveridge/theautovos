import test from 'node:test';
import assert from 'node:assert/strict';
import {quotePath} from '../src/site/content.mjs';
import {pageData,render} from '../src/site/pages.mjs';
import {agentReference} from '../src/site/agent-reference.mjs';
const base={demo:true,hostedDemo:true,origin:'https://7c4e9a.demos.beveridge.io',shop:'https://www.theautovos.com/shop',analyticsId:''};
test('live preview exposes real form and privacy copy while keeping indexing off',()=>{
 const config={...base,inquiryMode:'live',mailProvider:'cloudflare',turnstileSiteKey:'unit-test-site-key'};
 const pages=pageData(config),quote=render(pages.find(p=>p.path===quotePath),config),privacy=render(pages.find(p=>p.path==='/privacy/'),config);
 assert.match(quote,/data-inquiry-mode="live"/);assert.match(quote,/data-sitekey="unit-test-site-key"/);assert.match(quote,/turnstile\/v0\/api.js/);assert.match(quote,/Quote requests are sent to Auto Vos/);assert.match(quote,/content="noindex,nofollow"/);
 assert.doesNotMatch(quote,/Try demo inquiry|Inquiries are simulated|no message is sent/);
 assert.match(privacy,/Cloudflare Email Service carries/);assert.doesNotMatch(privacy,/Resend|sample submissions|no message reaches/);
 assert.doesNotMatch(agentReference(pages,config),/forms are simulated/i);
});
test('local preview keeps simulation disclosure and excludes live spam widgets',()=>{
 const config={...base,hostedDemo:false,inquiryMode:'simulated'},pages=pageData(config),quote=render(pages.find(p=>p.path===quotePath),config);
 assert.match(quote,/data-inquiry-mode="simulated"/);assert.match(quote,/Try demo inquiry/);assert.doesNotMatch(quote,/turnstile\/v0\/api.js/);
});
