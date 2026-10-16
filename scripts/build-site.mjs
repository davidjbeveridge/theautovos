import {agentReference} from '../src/site/agent-reference.mjs';
import {execFileSync} from 'node:child_process';
import {redirects as buildRedirects,routeRegistry,eligible} from '../src/site/routes.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {pageData,render,notFound,galleries} from '../src/site/pages.mjs';
import {business,services,quotePath} from '../src/site/content.mjs';
const demo=!process.argv.includes('--production');
const hostedDemo=process.argv.includes('--hosted-demo');
if(hostedDemo&&!demo)throw Error('Hosted demo cannot be a production build');
const origin=process.env.SITE_ORIGIN||'https://www.theautovos.com';
if(!(hostedDemo?/^https:\/\/7c4e9a\.demos\.beveridge\.io$/:/^https:\/\/([a-z0-9-]+\.)*theautovos\.com$/).test(origin))throw Error('SITE_ORIGIN must be an approved HTTPS host without trailing slash');
const config={demo,hostedDemo,origin,shop:demo?'https://www.theautovos.com/shop':process.env.SHOP_URL||'https://shop.theautovos.com/',turnstileSiteKey:process.env.TURNSTILE_SITE_KEY||'',analyticsId:demo?'':process.env.ANALYTICS_ID||''};
if(!/^https:\/\/(shop|merch|www)\.theautovos\.com\//.test(config.shop))throw Error('Unapproved shop URL');
if(config.analyticsId&&!/^G-[A-Z0-9]+$/.test(config.analyticsId))throw Error('Invalid analytics property ID');
const out=hostedDemo?'dist-hosted-demo':demo?'dist-demo':'dist-production';fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const write=(name,value)=>{const target=path.join(out,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,value);};
const pages=pageData(config);const planned=routeRegistry.filter(p=>eligible(p.path,config));if(new Set(pages.map(p=>p.path)).size!==pages.length)throw Error('Duplicate page route');if(pages.length!==planned.length||planned.some(r=>!pages.some(p=>p.path===r.path)))throw Error('Page coverage differs from canonical registry: '+planned.filter(r=>!pages.some(p=>p.path===r.path)).map(p=>p.path));
for(const page of [...pages,notFound()]){const file=page.path==='/'?'index.html':page.path==='/404.html'?'404.html':page.path.endsWith('/')?page.path.slice(1)+'index.html':page.path.slice(1)+'.html';write(file,render(page,config));}
const registry=JSON.parse(fs.readFileSync('design/presentation.yaml','utf8'));
write('site/tokens.css',':root{'+registry.variables.map(v=>v.projections?.css?`${v.projections.css.customProperty}:${v.values.base};`:'').join('')+'}\n');
write('site/style.css',fs.readFileSync('src/system.css','utf8')+'\n'+fs.readFileSync('src/site/site.css','utf8')+'\n'+fs.readFileSync('src/editorial.css','utf8')+'\n'+fs.readFileSync('src/inline-links.css','utf8')+'\n'+fs.readFileSync('src/motion.css','utf8')+'\n'+fs.readFileSync('src/reviews.css','utf8')+'\n'+fs.readFileSync('src/photo-viewer.css','utf8'));
write('site/client.js',fs.readFileSync('src/site/client.js','utf8')+'\n'+fs.readFileSync('src/motion.js','utf8')+'\n'+fs.readFileSync('src/photo-viewer.js','utf8')+'\n'+fs.readFileSync('src/browse-interactions.js','utf8'));
// Only referenced public assets are packaged. No proposal, audit, catalog or secrets.
const html=[...pages,notFound()].map(p=>render(p,config)).join('');const assets=new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map(m=>m[1]));assets.add('/assets/hero-poster.webp');for(const m of html.matchAll(/srcset="([^"]+)"/g))for(const candidate of m[1].split(','))assets.add(candidate.trim().split(' ')[0]);
for(const asset of assets){const source=asset.slice(1);if(!fs.existsSync(source))throw Error('Missing '+source);write(source,fs.readFileSync(source));}
write('robots.txt',demo?'User-agent: *\nDisallow: /\n':`User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n`);
write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(p=>`<url><loc>${origin+p.path}</loc></url>`).join('')}</urlset>\n`);
const inventory=JSON.parse(fs.readFileSync('design/page-inventory.json','utf8'));
const redirects=buildRedirects(config,pages);
write('_redirects',redirects.map(r=>`${r.from} ${r.to} 301`).join('\n')+'\n');
write('_headers',`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n${demo?'  X-Robots-Tag: noindex, nofollow\n':''}/site/*\n  Cache-Control: public, max-age=3600\n/assets/*\n  Cache-Control: public, max-age=86400\n`);
write('llms.txt',agentReference(pages,config));
fs.mkdirSync('design-artifacts',{recursive:true});fs.writeFileSync(`design-artifacts/${hostedDemo?'hosted-demo':demo?'demo':'production'}-manifest.json`,JSON.stringify({config,pages:pages.map(({path,title})=>({path,title})),assets:[...assets],redirects,retire:[...inventory.routes.filter(r=>['retire_pending_review','retire_approved'].includes(r.productionAction)).map(r=>r.path),'/art/'],galleryCounts:galleries.map(g=>[g.path,g.images.length])},null,2));
console.log(`${out}: ${pages.length} pages, ${assets.size} assets, ${redirects.length} redirects. ${demo?'Simulation only; no email delivery.':'Production candidate; launch gates still required.'}`);

if(demo&&!hostedDemo)execFileSync('python3',['scripts/build-qa-digest.py'],{stdio:'inherit'});
