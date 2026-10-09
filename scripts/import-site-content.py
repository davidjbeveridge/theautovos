"""One-time extraction from the audited Squarespace snapshot; no network calls."""
import json,pathlib,re,hashlib
from html.parser import HTMLParser
from urllib.parse import urlsplit
class Node:
 def __init__(self,tag='',attrs=()): self.tag=tag;self.attrs=dict(attrs);self.children=[]
 def all(self,p): return ([self] if p(self) else [])+[n for c in self.children if isinstance(c,Node) for n in c.all(p)]
 def text(self): return ' '.join(c.text() if isinstance(c,Node) else c for c in self.children).strip()
class Parser(HTMLParser):
 def __init__(self): super().__init__();self.root=Node();self.stack=[self.root]
 def handle_starttag(self,t,a):
  n=Node(t,a);self.stack[-1].children.append(n)
  if t not in ('img','br','hr','input','meta','link','source','wbr','area','embed','param','track','col'): self.stack.append(n)
 def handle_endtag(self,t):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i].tag==t: self.stack=self.stack[:i];break
 def handle_data(self,d): self.stack[-1].children.append(d)
root=pathlib.Path('reports/audit-2026-10-07'); inventory=json.loads(pathlib.Path('design/page-inventory.json').read_text()); paths={r['path'] for r in inventory['routes'] if r['template']=='story'}
titles=['Luftgekühlt 6 · Black & white 35mm','Pikes Peak Airstrip Attack 2019','Drive OZ · Air-cooled Porsche','Pikes Peak Hill Climb 2019 · Tyspeed / Apex Racing Parts','Pikes Peak Hill Climb 2019 · Porsche','Porsche 918 · Studio flash photography','Porsche 356 SC · Studio flash photography','Porsche Safari · A day in the dirt','Pikes Peak Hill Climb · Paul Kolinski']
titlemap=dict(zip([r['path'] for r in inventory['routes'] if r['template']=='story'],titles)); galleries=[];legacy={};assets=[]
for line in (root/'crawl/pages.jsonl').read_text().splitlines():
 p=json.loads(line);path=urlsplit(p['url']).path; parser=Parser();parser.feed((root/p['raw_html_path']).read_text());m=parser.root.all(lambda n:n.tag=='main'); main=m[0] if m else parser.root
 if path in paths:
  slides=main.all(lambda n:'slide' in n.attrs.get('class','').split()); images=[]
  for slide in slides:
   imgs=slide.all(lambda n:n.tag=='img')
   if not imgs:continue
   im=imgs[0];url=im.attrs.get('data-src',im.attrs.get('src','')); dims=im.attrs.get('data-image-dimensions','1500x1000').split('x');caption=slide.text();name=hashlib.sha256(url.encode()).hexdigest()[:16]+'.jpg';alt=im.attrs.get('alt','')
   if not alt or re.search(r'\.(jpe?g|png)$',alt,re.I):alt=f'{titlemap[path]} — photograph {len(images)+1}'
   item={'src':'/assets/gallery/'+name,'source':url,'alt':alt,'width':int(dims[0]),'height':int(dims[1]),'caption':caption};images.append(item);assets.append(item)
  galleries.append({'path':path,'title':titlemap[path],'credit':'Blaq Rocket Media','source':p['url'],'images':images})
 if path in ['/team','/art','/studio-info']:
  legacy[path]={'source':p['url'],'text':main.text(),'images':[]}
  for im in main.all(lambda n:n.tag=='img'):
   url=im.attrs.get('data-src',im.attrs.get('src',''))
   if url and url not in [i['source'] for i in legacy[path]['images']]:legacy[path]['images'].append({'source':url,'alt':im.attrs.get('alt','')})
pathlib.Path('src/site/galleries.json').write_text(json.dumps(galleries,indent=2)+'\n');pathlib.Path('design/legacy-content.json').write_text(json.dumps(legacy,indent=2)+'\n');pathlib.Path('design/gallery-assets.json').write_text(json.dumps(assets,indent=2)+'\n')
print([(g['path'],len(g['images'])) for g in galleries]);print('Total',len(assets));print(json.dumps(legacy,indent=2)[:7000])
