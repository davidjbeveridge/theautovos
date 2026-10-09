"""Deterministic local image variants; never upscale or alter people."""
from pathlib import Path
from PIL import Image,ImageOps
import json
root=Path(__file__).resolve().parents[1];items={}
# Include the existing gallery originals and service photos; exclude generated derivatives.
for p in sorted((root/'assets').rglob('*')):
 if p.suffix.lower() not in ['.jpg','.jpeg','.png','.webp'] or 'responsive' in p.parts or 'video-stills' in p.parts:continue
 try:
  with Image.open(p) as im:
   im=ImageOps.exif_transpose(im);im=im.convert('RGBA' if 'A' in im.getbands() or 'transparency' in im.info else 'RGB');w,h=im.size
   if w<480:continue
   key='/'+p.relative_to(root).as_posix(); stem=p.relative_to(root/'assets').as_posix().replace('/','--').rsplit('.',1)[0]
   sizes=sorted(set([min(w,x) for x in ([480,960,1600,1920] if "targa-guide" in p.parts else [480,960,1600])]));variants=[]
   for size in sizes:
    out=root/'assets/responsive'/f'{stem}-{size}.webp';out.parent.mkdir(exist_ok=True)
    if not out.exists() or out.stat().st_mtime<p.stat().st_mtime:im.resize((size,round(h*size/w)),Image.Resampling.LANCZOS).save(out,'WEBP',quality=82,method=6)
    variants.append({'src':'/'+out.relative_to(root).as_posix(),'width':size})
   items[key]={'width':w,'height':h,'variants':variants}
 except (OSError,ValueError):continue
(root/'src/site/image-manifest.json').write_text(json.dumps(items,indent=2)+'\n');print(f'{len(items)} image records; no upscaling')
