"""Reproducible, non-generative grading. Originals and scene geometry remain intact."""
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
ROOT = Path(__file__).resolve().parents[1]
# Neutralize the shop's mild green/yellow cast. Stronger tone separation only
# for the washed-out through-glass views; retain water, reflections and film edges.
for n in range(1, 11):
    source = ROOT / f'assets/targa-guide/step-{n:02}.jpg'
    im = Image.open(source).convert('RGB')
    x = np.asarray(im, dtype=np.float32) / 255
    x *= np.array([1.005, .995, 1.015], dtype=np.float32)
    strength = .24 if n in (6,7,8,9) else .18
    x = x + strength * (x - .5) * (1 - np.abs(2*x-1))
    im = Image.fromarray(np.uint8(np.clip(x,0,1)*255))
    im = ImageEnhance.Color(im).enhance(1.09)
    im = im.filter(ImageFilter.UnsharpMask(radius=.8, percent=45, threshold=3))
    im.save(ROOT / f'assets/targa-guide/step-{n:02}-graded.jpg', quality=94, subsampling=0)
print('Graded 10 original 1920×1080 frames; no synthesis, cropping or upscaling.')
