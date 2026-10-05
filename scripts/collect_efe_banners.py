"""Download five EFE homepage banners with their mobile artwork."""
import html
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = urllib.request.urlopen('https://www.efe.com.pe/', timeout=45).read().decode('utf-8')
tags = [tag for tag in re.findall(r'<img\b[^>]+>', source) if 'alt="slide"' in tag][:10]
if len(tags) != 10:
    raise RuntimeError('Expected five desktop/mobile banner pairs')
target = ROOT / 'storage/app/public/banners/efe'
target.mkdir(parents=True, exist_ok=True)
names = ['Televisores y entretenimiento', 'Electrohogar Coldex', 'Intel Gamer Days', 'Celulares y smartphones', 'Laptops y cómputo']
categories = ['TV', 'Refrigeración', 'Mundo Gamer', 'Celulares', 'Cómputo']
records = []
for index in range(5):
    record = {'titulo': 'EFE - ' + names[index], 'categoria': categories[index], 'fuente_url': 'https://www.efe.com.pe/'}
    for offset, label in [(0, 'desktop'), (1, 'mobile')]:
        url = html.unescape(re.search(r'src="([^"]+)"', tags[index * 2 + offset])[1])
        extension = Path(url).suffix
        name = f'efe-{index + 1}-{label}{extension}'
        image = urllib.request.urlopen(url, timeout=45).read()
        if not (image.startswith(b'\xff\xd8') or image.startswith(b'\x89PNG') or image.startswith(b'RIFF')):
            raise RuntimeError('Invalid image: ' + url)
        (target / name).write_bytes(image)
        record[label + '_url'] = '/storage/banners/efe/' + name
        record[label + '_source'] = url
    records.append(record)
(ROOT / 'database/seed-data/banners-efe.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
print('Downloaded 5 banners, each with desktop and mobile artwork.')
