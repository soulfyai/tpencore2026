"""Use edited raster logos directly, without text overlays."""
from pathlib import Path
import base64,re
ROOT=Path(__file__).resolve().parents[1]
def apply(s):
 s=s.replace('北北基桃','大台北')
 images={kind:'data:image/png;base64,'+base64.b64encode((ROOT/'prototypes/assets'/f'brand-greater-taipei-{kind}.png').read_bytes()).decode() for kind in ['desktop','mobile']}
 def picture(m):
  text=m[0]
  if 'data:image/' not in text:return text
  text=re.sub(r'(srcset=")data:image/[^\"]+',lambda _: 'srcset="'+images['mobile'],text)
  text=re.sub(r'(src=")data:image/[^\"]+',lambda _: 'src="'+images['desktop'],text)
  return text
 return re.sub(r'<picture[^>]*>.*?</picture>',picture,s,flags=re.S)
