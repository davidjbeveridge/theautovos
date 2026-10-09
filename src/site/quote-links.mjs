import {paths} from './routes.mjs';
const topic=/\b(?:pric(?:e[ds]?|ing)|costs?|quotes?|budgets?|estimates?|fees?|how much (?:does|is|will|would|should))\b/i;
const text=html=>html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
export function quoteContext(page){
 const path=page.path;const service=page.service||(/window-tint|tint-cost|targa|ceramic-vs-carbon/.test(path)?'tint':/paint-protection|ppf/.test(path)?'ppf':/ceramic-coating/.test(path)?'ceramic':'');
 const make=/\/porsche\//.test(path)?'Porsche':/\/bmw\//.test(path)?'BMW':/\/tesla\//.test(path)?'Tesla':'';
 const params=new URLSearchParams();if(service)params.set('service',service);if(make)params.set('make',make);
 return paths.quote+(params.size?'?'+params.toString().replaceAll('&','&amp;'):'');
}
// Build-time enhancement of our own authored HTML. Keep review quotations and form controls intact.
export function addQuoteLinks(html,page){
 if(page.path===paths.quote)return html;
 const href=quoteContext(page),link=`<a class="site-inline-quote" href="${href}">Get a quote</a>`;
 const protectedParts=[];
 html=html.replace(/<article\b[^>]*class="site-review"[^>]*>[\s\S]*?<\/article>/gi,part=>`<!--quote-protected-${protectedParts.push(part)-1}-->`);
 html=html.replace(/<(blockquote|form)\b[^>]*>[\s\S]*?<\/\1>/gi,part=>`<!--quote-protected-${protectedParts.push(part)-1}-->`);
 // One action inside each relevant disclosure, including questions whose answer has no pricing keyword.
 html=html.replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi,part=>{
  if(!topic.test(text(part))||part.includes('href="'+paths.quote))return part;
  return part.replace('</details>',`<p>${link}</p></details>`);
 });
 // Do not add a second action to individual paragraphs within a disclosure.
 html=html.replace(/<details\b[^>]*>[\s\S]*?<\/details>/gi,part=>`<!--quote-protected-${protectedParts.push(part)-1}-->`);
 for(const name of ['p','li'])html=html.replace(new RegExp('<('+name+')\\b([^>]*)>([\\s\\S]*?)<\\/\\1>','gi'),(all,tag,attrs,body)=>{
  if(!topic.test(text(body))||body.includes('href="'+paths.quote)||/<(?:p|ul|ol|blockquote)\b/.test(body))return all;
  return `<${tag}${attrs}>${body} ${link}.</${tag}>`;
 });
 for(let i=protectedParts.length-1;i>=0;i--)html=html.replaceAll(`<!--quote-protected-${i}-->`,protectedParts[i]);
 return html;
}
