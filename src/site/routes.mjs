import {readFileSync} from 'node:fs';
export const inventory=JSON.parse(readFileSync(new URL('../../design/page-inventory.json',import.meta.url)));
export const routeRegistry=inventory.plannedPages;
export const paths={quote:'/get-a-quote/',studio:'/about/',care:'/care-and-warranty/',gallery:'/gallery/',resources:'/resources/',tint:'/services/window-tint/',ppf:'/services/paint-protection-film/',ceramic:'/services/ceramic-coating/'};
export const blockedPaths=new Set(['/work/tesla/','/work/bmw/','/work/paint-protection-film/bmw/','/reviews/']);
export function eligible(path,config){return config.demo||!blockedPaths.has(path);}
export function canonicalPath(path){return inventory.plannedRedirects.find(r=>r.from===path)?.to||path;}
export function redirects(config,pages){const active=new Set(pages.map(p=>p.path));const result=new Map();
 for(const r of inventory.routes){if(r.productionAction==='retain_external')result.set(r.path,config.demo?r.source:r.proposedDestination);else if(['consolidate','rebuild_redirect'].includes(r.productionAction))result.set(r.path,canonicalPath(r.proposedDestination));}
 for(const r of inventory.plannedRedirects)result.set(r.from,canonicalPath(r.to));
 for(const p of pages)if(p.path!=='/'&&p.path.endsWith('/'))result.set(p.path.slice(0,-1),p.path);
 return [...result].filter(([from,to])=>from!==to&&!active.has(from)&&(to.startsWith('https://')||active.has(to.split('#')[0]))).flatMap(([from,to])=>[{from,to},...(!from.endsWith('/')&&!from.includes('.')&&!active.has(from+'/')?[{from:from+'/',to}]:[])]).filter((v,i,a)=>a.findIndex(x=>x.from===v.from)===i);
}
export function crumbs(path){const parts=path.split('/').filter(Boolean),out=[{path:'/',title:'Home'}];for(let i=1;i<=parts.length;i++){const p='/'+parts.slice(0,i).join('/')+'/';const r=routeRegistry.find(x=>x.path===p);if(r)out.push({path:p,title:r.title});}return out;}
