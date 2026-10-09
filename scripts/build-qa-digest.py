#!/usr/bin/env python3
"""Extract visible questions/answers from every built demo page; no separate copy inventory."""
from html.parser import HTMLParser
from pathlib import Path
import json, hashlib, sys
class Node:
 def __init__(self,tag='',attrs=()):self.tag=tag;self.attrs=dict(attrs);self.children=[];self.parent=None
 def text(self):return ' '.join(' '.join(c.text() if isinstance(c,Node) else c for c in self.children).split())
 def find(self,tags):
  for c in self.children:
   if isinstance(c,Node):
    if c.tag in tags:yield c
    yield from c.find(tags)
class Tree(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.root=Node();self.stack=[self.root]
 def handle_starttag(self,t,a):
  n=Node(t,a);n.parent=self.stack[-1];n.parent.children.append(n)
  if t not in {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}:self.stack.append(n)
 def handle_startendtag(self,t,a):self.handle_starttag(t,a);self.handle_endtag(t)
 def handle_endtag(self,t):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i].tag==t:self.stack=self.stack[:i];break
 def handle_data(self,d):self.stack[-1].children.append(d)
manifest=json.loads(Path('design-artifacts/demo-manifest.json').read_text());records={};coverage=[]
for page in manifest['pages']:
 route=page['path'];p=Path('dist-demo')/('index.html' if route=='/' else route.strip('/')+'/index.html');tree=Tree();tree.feed(p.read_text());main=next(tree.root.find({'main'}));found=[]
 for detail in main.find({'details'}):
  summary=next(detail.find({'summary'}),None)
  if summary and '?' in summary.text():found.append((summary.text(),' '.join(c.text() for c in detail.children if isinstance(c,Node) and c.tag!='summary')))
 for h in main.find({'h2','h3','h4'}):
  if not h.text().endswith('?'):continue
  siblings=h.parent.children;parts=[]
  for c in siblings[siblings.index(h)+1:]:
   if isinstance(c,Node):
    if c.tag not in {'p','ul','ol'}:break
    parts.append(c.text())
  if parts:found.append((h.text(),' '.join(parts)))
 for q,a in found:
  key=(q,a)
  if key not in records:records[key]=[]
  if route not in records[key]:records[key].append(route)
 coverage.append((route,len(found)))
lines=['# Auto Vos — questions and answers for Caleb’s review','','Please check every answer for accuracy, especially products, availability, installation methods, care, timing, pricing and warranty promises. Add corrections as Google Doc comments, referring to the question number. Flag anything you would not say to a customer. Approval is still pending.','','Identical questions and answers are shown once, with every page using that wording listed underneath. Different answers to the same question are kept separate. Includes FAQ disclosures and explanatory question headings across all built pages, including conditional previews. Pages with no Q&A are listed at the end.','','This digest is generated from site content. Website copy is the source of truth; incorporate approved comments into the site, regenerate this digest, then sync this same Google Doc. Do not treat edits here as automatically applied to the website.','']
for i,((q,a),routes) in enumerate(records.items(),1):lines += [f'## {i}. {q}','',a,'','Pages: '+', '.join(routes),'']
lines += ['## Page coverage','']+[f'- {r}: {n} question/answer entries' for r,n in coverage]
text='\n'.join(lines)+'\n';target=Path('handoff/caleb-qa-digest.md');digest=hashlib.sha256(text.encode()).hexdigest()
if '--check' in sys.argv:
 if not target.exists() or target.read_text()!=text:raise SystemExit('Q&A digest stale: run npm run build:site, then sync the Google Doc.')
 if '--require-synced' in sys.argv:
  sync=json.loads(Path('handoff/qa-digest-sync.json').read_text())
  if sync.get('sha256')!=digest:raise SystemExit('Google Q&A digest is stale. Sync the existing Doc and verify its export before recording the new hash.')
else:target.write_text(text)
print(json.dumps({'unique_answers':len(records),'pages':len(coverage),'sha256':digest}))
