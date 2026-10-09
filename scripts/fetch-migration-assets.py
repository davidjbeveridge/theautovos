"""Fetch exact audited public images using curl; resumable, no paid APIs."""
import json,pathlib,subprocess,concurrent.futures,hashlib
items=json.loads(pathlib.Path('design/gallery-assets.json').read_text()); legacy=json.loads(pathlib.Path('design/legacy-content.json').read_text())
for path in ['/team','/art']:
 for i,item in enumerate(legacy[path]['images']):
  item['src']=f'/assets/migrated/{path.strip("/")}-{i+1}'+pathlib.Path(item['source'].split('?')[0]).suffix.lower();items.append(item)
pathlib.Path('design/legacy-content.json').write_text(json.dumps(legacy,indent=2)+'\n')
def fetch(item):
 dest=pathlib.Path('.'+item['src']);dest.parent.mkdir(exist_ok=True,parents=True)
 if dest.exists() and dest.stat().st_size>100:return
 url=item['source']+'?format=1500w';temp=dest.with_suffix('.tmp')
 subprocess.run(['curl','--fail','--silent','--show-error','--retry','2','--max-time','60',url,'-o',str(temp)],check=True);temp.replace(dest)
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:list(pool.map(fetch,items))
print('Ready:',len(items),'asset references')
