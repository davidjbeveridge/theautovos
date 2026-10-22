import {readFileSync} from 'node:fs';
import {escape as e} from '../components.mjs';
import {business,services} from './content.mjs';
import {crumbs,routeRegistry} from './routes.mjs';
import {serviceQuestions} from './education.mjs';

const images=JSON.parse(readFileSync(new URL('./image-manifest.json',import.meta.url)));
// Upload dates and durations from archived yt-dlp metadata, not article publication dates.
const videoFacts={
 '5cyZbLkMrrU':{uploadDate:'2026-09-16',duration:'PT37M11S'},
 'DFrqoozu5S0':{uploadDate:'2024-08-22',duration:'PT31M14S'},
 'whzQA20n6XM':{uploadDate:'2024-08-30',duration:'PT1M2S'}
};
export const textOnly=html=>html.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
const attributes=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([,k,v])=>[k,textOnly(v)]));
export function primaryImage(page){
 const first=page.body.match(/<img\b[^>]*src="\/assets\/[^>]+>/)?.[0];
 const attrs=page.sharingImage||(first?attributes(first):{src:'/assets/hero-poster.webp',alt:'Auto Vos vehicle protection studio in Colorado Springs'});
 const data=images[attrs.src];
 const variant=data?.variants?.find(v=>v.width>=1200)||data?.variants?.at(-1);
 return {src:variant?.src||attrs.src,original:attrs.src,alt:attrs.alt,width:variant?.width||data?.width||Number(attrs.width)||1280,height:variant?Math.round(variant.width*data.height/data.width):data?.height||Number(attrs.height)||720};
}
export const isArticle=page=>!!page.video||(page.path.startsWith('/resources/')&&page.path!=='/resources/');
const mimeType=src=>({'webp':'image/webp','jpg':'image/jpeg','jpeg':'image/jpeg','png':'image/png'}[src.split('.').at(-1)]);
const siteProfiles=['https://www.instagram.com/theautovos/','https://www.youtube.com/@TheAutoVos','https://www.facebook.com/theautovos'];
const location={'@type':'City',name:'Colorado Springs',containedInPlace:{'@type':'State',name:'Colorado'}};
const questionPairs=html=>[...html.matchAll(/<details(?:\s[^>]*)?>\s*<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)].map(([,q,a])=>[textOnly(q),textOnly(a)]).filter(([q])=>q.endsWith('?'));
const faqOwners=new Map();
for(const s of [...services,{id:'windshield',faq:[],path:'/services/windshield-protection-film/'}])for(const [q,a] of questionPairs(serviceQuestions(s.id,s.faq)))if(!faqOwners.has(q+'\n'+a))faqOwners.set(q+'\n'+a,s.path);
export function pageSchema(page,config){
 const origin=config.origin,url=origin+page.path,image=primaryImage(page);
 const article=isArticle(page);
 const service=page.path.startsWith('/services/')&&!!page.service;
 const collection=['/services/','/resources/','/work/','/gallery/','/reviews/'].includes(page.path)||page.path.startsWith('/gallery/')||(page.path.startsWith('/work/')&&!article);
 const businessId=origin+'/#business',websiteId=origin+'/#website',pageId=url+'#webpage',imageId=url+'#primary-image';
 const core=services.some(s=>s.path===page.path)||page.path==='/services/windshield-protection-film/';
 const answers=core?questionPairs(page.body).filter(([q,a])=>faqOwners.get(q+'\n'+a)===page.path).map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}})):[];
 const gallery=page.path.startsWith('/gallery/')&&page.path!=='/gallery/';
 const pageNode={'@type':answers.length?['WebPage','FAQPage']:gallery?'ImageGallery':collection?'CollectionPage':page.path==='/contact/'?'ContactPage':page.path==='/about/'?'AboutPage':'WebPage','@id':pageId,url,name:page.title,description:page.description,inLanguage:'en-US',isPartOf:{'@id':websiteId},about:{'@id':businessId},publisher:{'@id':businessId},primaryImageOfPage:{'@id':imageId},...(answers.length?{mainEntity:answers}:{})};
 const graph=[
  {'@type':'AutomotiveBusiness','@id':businessId,name:business.name,description:'Vehicle protection in Colorado Springs. By appointment only; call or email before visiting.',legalName:business.legalName,url:origin+'/',logo:origin+'/assets/auto-vos-logo.svg',image:origin+'/assets/hero-poster.webp',email:business.email,telephone:business.tel,address:{'@type':'PostalAddress',streetAddress:business.street,addressLocality:business.city,addressRegion:business.region,postalCode:business.postal,addressCountry:'US'},areaServed:location,contactPoint:{'@type':'ContactPoint',contactType:'customer service',telephone:business.tel,email:business.email,url:origin+'/contact/'},sameAs:siteProfiles,hasMap:'https://www.google.com/maps/search/?api=1&query=Auto%20Vos&query_place_id=ChIJ8_wKDA1bE4cR2t0X4b81mzQ',openingHoursSpecification:[{'@type':'OpeningHoursSpecification',dayOfWeek:['Monday','Tuesday','Wednesday','Thursday','Friday'],opens:'09:00',closes:'17:00'}]},
  {'@type':'WebSite','@id':websiteId,url:origin+'/',name:business.name,inLanguage:'en-US',publisher:{'@id':businessId}},pageNode,
  {'@type':'ImageObject','@id':imageId,contentUrl:origin+image.src,url:origin+image.src,caption:image.alt,encodingFormat:mimeType(image.src),width:image.width,height:image.height}
 ];
 if(page.path!=='/'&&!page.noindex){graph.push({'@type':'BreadcrumbList','@id':url+'#breadcrumbs',itemListElement:crumbs(page.path).map((c,i)=>({'@type':'ListItem',position:i+1,name:c.title,item:origin+c.path}))});pageNode.breadcrumb={'@id':url+'#breadcrumbs'};}
 if(['/contact/','/about/'].includes(page.path))pageNode.mainEntity={'@id':businessId};
 if(service){
  const base=services.find(s=>s.id===page.service);const serviceId=url+'#service';
  graph.push({'@type':'Service','@id':serviceId,name:page.title.replace(/\s*\|.*$/,'').replace(/ in Colorado Springs$/,''),serviceType:base?.name||'Windshield protection film',description:page.description,url,provider:{'@id':businessId},areaServed:location,mainEntityOfPage:{'@id':pageId}});
  pageNode.about={'@id':serviceId};
 }
 if(article){
  const citations=[...page.body.matchAll(/href="(https:\/\/[^"<>]+)"/g)].map(m=>textOnly(m[1])).filter(u=>/xpel\.com|suntekfilms\.com|leg\.colorado\.gov/.test(u));
  graph.push({'@type':'Article','@id':url+'#article',headline:textOnly(page.body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]||page.title),description:page.description,inLanguage:'en-US',author:{'@id':businessId},isPartOf:{'@id':websiteId},mainEntityOfPage:{'@id':pageId},publisher:{'@id':businessId},image:{'@id':imageId},about:location,...(citations.length?{citation:[...new Set(citations)]}:{}),...(page.video?{video:{'@id':url+'#video'}}:{})});
  pageNode.mainEntity={'@id':url+'#article'};
 }
 if(page.video&&videoFacts[page.video.id]){
  graph.push({'@type':'VideoObject','@id':url+'#video',name:page.video.title,description:page.video.description,thumbnailUrl:origin+image.src,inLanguage:'en-US',mainEntityOfPage:{'@id':pageId},embedUrl:'https://www.youtube-nocookie.com/embed/'+page.video.id,url:page.video.sourceUrl,...videoFacts[page.video.id],creator:{'@id':businessId},publisher:{'@id':businessId}});
 }
 // Lists describe actual linked destinations, not synthetic keyword permutations.
 if(gallery){
  const photos=[...page.body.matchAll(/<figure[^>]*>([\s\S]*?)<\/figure>/g)].map(([,figure])=>{const tag=figure.match(/<img\b[^>]+>/)?.[0];if(!tag)return null;const a=attributes(tag),meta=images[a.src];return {'@type':'ImageObject',contentUrl:origin+a.src,name:a.title||a.alt,description:a.alt,caption:textOnly(figure.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/)?.[1]||a.alt),width:meta?.width||Number(a.width),height:meta?.height||Number(a.height)};}).filter(Boolean);
  pageNode.associatedMedia=photos;
 }else if(collection){
  const seen=new Set();const items=[...page.body.matchAll(/<a\b[^>]*href="(\/[^"?#]*)"[^>]*>([\s\S]*?)<\/a>/g)].filter(([,href])=>/^\/(services|work|gallery|resources)\//.test(href)&&href!==page.path&&routeRegistry.some(r=>r.path===href)&&!seen.has(href)&&seen.add(href));
  if(items.length){graph.push({'@type':'ItemList','@id':url+'#destinations',itemListElement:items.map(([,href,label],i)=>({'@type':'ListItem',position:i+1,url:origin+href,name:textOnly(label)||routeRegistry.find(r=>r.path===href).title}))});pageNode.mainEntity={'@id':url+'#destinations'};}
 }
 return {'@context':'https://schema.org','@graph':graph};
}
export function pageHead(page,config){
 const image=primaryImage(page),url=config.origin+page.path,article=isArticle(page);
 const title=page.title+(page.title.includes('Auto Vos')?'':' | Auto Vos');
 return `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)}</title><meta name="description" content="${e(page.description)}"><meta name="robots" content="${config.demo||page.noindex?'noindex,nofollow':'index,follow,max-image-preview:large'}"><link rel="canonical" href="${url}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(page.description)}"><meta property="og:type" content="${article?'article':'website'}"><meta property="og:site_name" content="Auto Vos"><meta property="og:locale" content="en_US"><meta property="og:url" content="${url}"><meta property="og:image" content="${config.origin+image.src}"><meta property="og:image:secure_url" content="${config.origin+image.src}"><meta property="og:image:type" content="${mimeType(image.src)}"><meta property="og:image:alt" content="${e(image.alt)}"><meta property="og:image:width" content="${image.width}"><meta property="og:image:height" content="${image.height}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(title)}"><meta name="twitter:description" content="${e(page.description)}"><meta name="twitter:image" content="${config.origin+image.src}"><meta name="twitter:image:alt" content="${e(image.alt)}"><script type="application/ld+json">${JSON.stringify(pageSchema(page,config)).replaceAll('<','\\u003c')}</script>`;
}
