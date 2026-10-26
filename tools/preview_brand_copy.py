"""Responsive live slogan layer for the preserved preview logo."""
import re
SLOGAN='一起打造你我的大台北'
def apply(s):
 s=s.replace('北北基桃','大台北')
 desktop=f'<svg class="brand-slogan brand-slogan-desktop" viewBox="0 0 2158 729" aria-hidden="true"><rect x="1030" y="460" width="923" height="140" rx="20" fill="#061226"/><text x="1491" y="550" text-anchor="middle" fill="#ffe5a0" font-size="62" font-weight="900" letter-spacing="7">{SLOGAN}</text></svg>'
 mobile=f'<svg class="brand-slogan brand-slogan-mobile" viewBox="0 0 1902 827" aria-hidden="true"><rect x="300" y="620" width="1290" height="98" rx="16" fill="#041329"/><text x="945" y="697" text-anchor="middle" fill="#ffe5a0" font-size="76" font-weight="900" letter-spacing="12">{SLOGAN}</text></svg>'
 # Both embedded brand pictures: header and loading screen.
 s=re.sub(r'(<picture[^>]*>.*?</picture>)',lambda m:m[0].replace('</picture>',desktop+mobile+'</picture>') if 'data:image/' in m[0] else m[0],s,flags=re.S)
 css='''<style>
.hi-brandart,.loading-brand picture{position:relative}
.brand-slogan{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.brand-slogan text{font-family:"Noto Sans TC",sans-serif;filter:drop-shadow(0 0 7px #ffad25)}
.brand-slogan-mobile{display:none}
@media(max-width:860px){.brand-slogan-desktop{display:none}.brand-slogan-mobile{display:block}}
</style>'''
 return s.replace('</head>',css+'</head>',1)
