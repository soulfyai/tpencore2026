"""Build the NAS website ZIP and a separate scheduler/setup kit."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from package_site import package
ROOT=Path(__file__).resolve().parents[1]
site=ROOT/'out/site'
package(site)
version=(ROOT/'VERSION').read_text().strip()
website=ROOT/f'out/tpencore-nas-v{version}.zip'
with ZipFile(website,'w',ZIP_DEFLATED) as z:
    for p in sorted(site.iterdir()):
        if p.is_file():z.write(p,'counter.php' if p.name=='counter.php.txt' else p.name)
kit=ROOT/f'out/tpencore-nas-automation-v{version}.zip'
with ZipFile(kit,'w',ZIP_DEFLATED) as z:
    for name in ['synology-update.sh','NAS_QUICK_START.md','SYNOLOGY.md']:
        z.write(ROOT/'deploy'/name,name)
print(f'Website: {website}\nAutomation: {kit}')
