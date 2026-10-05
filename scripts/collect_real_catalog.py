"""Collect public EFE product facts and images; reruns reuse downloaded files."""
import concurrent.futures
import hashlib
import html
import json
import re
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'database' / 'seed-data'
IMAGES = ROOT / 'storage' / 'app' / 'public' / 'productos' / 'catalogo-real'
DATA.mkdir(parents=True, exist_ok=True)
IMAGES.mkdir(parents=True, exist_ok=True)
BASE = 'https://www.efe.com.pe'
CATEGORIES = {
    'Celulares': ['/tecnologia/celulares/celulares-y-smartphones.html'],
    'Cómputo': ['/tecnologia/computacion/laptops.html'],
    'Mundo Gamer': ['/tecnologia/gaming.html'],
    'Audio': ['/tecnologia/audio.html'],
    'TV': ['/tecnologia/televisores.html'],
    'Videojuegos': ['/tecnologia/videojuegos.html'],
    'Cámaras y Drones': ['/tecnologia/fotografia-y-video.html'],
    'Smartwatches': ['/tecnologia/celulares/smartwatch.html'],
    'Smarthome y domótica': ['/tecnologia/smart-home-y-domotica.html'],
    'Refrigeración': ['/electrohogar/refrigeracion.html'],
    'Lavado': ['/electrohogar/lavado.html'],
    'Cocina': ['/electrohogar/cocina.html'],
    'Electrodomésticos': ['/electrohogar/electrodomesticos.html'],
}

def fetch(url):
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=45) as response:
                return response.read()
        except Exception:
            if attempt == 2:
                raise
            time.sleep(1)

def clean(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', str(value)))).strip()

def product(url, category):
    source = fetch(url).decode('utf-8')
    fact = None
    for block in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', source, re.S):
        data = json.loads(block)
        for node in data.get('@graph', [data]):
            if node.get('@type') == 'Product':
                fact = node
                break
    if not fact or not fact.get('offers', {}).get('price'):
        raise ValueError('Missing product or price')
    specifications = {}
    table = re.search(r'<table[^>]*id="product-attribute-specs-table"[^>]*>(.*?)</table>', source, re.S)
    if table:
        for key, value in re.findall(r'<th[^>]*>(.*?)</th>\s*<td[^>]*>(.*?)</td>', table[1], re.S):
            specifications[clean(key)] = clean(value)
    for item in fact.get('additionalProperty', []):
        specifications.setdefault(clean(item['name']), clean(item['value']))
    price = float(fact['offers']['price'])
    old = re.search(r'data-price-amount="([\d.]+)"\s*data-price-type="oldPrice"', source)
    previous = max(price, float(old[1])) if old else price
    image_url = fact.get('image')
    if isinstance(image_url, list):
        image_url = image_url[0]
    if isinstance(image_url, dict):
        image_url = image_url['url']
    extension = Path(image_url.split('?')[0]).suffix.lower()
    if extension not in ['.jpg', '.jpeg', '.png', '.webp']:
        raise ValueError('Unsupported image')
    filename = hashlib.sha256(url.encode()).hexdigest()[:20] + extension
    target = IMAGES / filename
    if not target.exists():
        image = fetch(image_url)
        if not (image.startswith(b'\xff\xd8') or image.startswith(b'\x89PNG') or image.startswith(b'RIFF')):
            raise ValueError('Invalid image response')
        target.write_bytes(image)
    return {
        'category': category, 'name': clean(fact['name']), 'brand': clean(fact.get('brand', {}).get('name', 'Sin marca')),
        'model': str(fact['sku']), 'description': clean(fact.get('description', '')),
        'specifications': specifications, 'warranty': specifications.get('Garantía', 'No indicada en la ficha del vendedor'),
        'price': price, 'previous_price': previous, 'currency': fact['offers']['priceCurrency'],
        'source_url': url, 'image_source_url': image_url,
        'image_path': 'productos/catalogo-real/' + filename, 'collected_on': '2026-10-04',
    }

def collect(category, paths):
    products = []
    seen = set()
    for path in paths:
        for page in range(1, 5):
            source = fetch(BASE + path + '?p=' + str(page)).decode('utf-8')
            tags = re.findall(r'<a\b[^>]*class="product-item-link"[^>]*>', source)
            links = list(dict.fromkeys(html.unescape(re.search(r'href="([^"]+)"', tag)[1]) for tag in tags))
            for url in links:
                if url in seen:
                    continue
                seen.add(url)
                try:
                    products.append(product(url, category))
                    print(category, len(products), products[-1]['model'], flush=True)
                except Exception as error:
                    print('SKIP', url, str(error), flush=True)
                if len(products) == 10:
                    return products
    raise ValueError(f'{category}: only {len(products)} products')

if __name__ == '__main__':
    records = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(collect, cat, paths): cat for cat, paths in CATEGORIES.items()}
        for future in concurrent.futures.as_completed(futures):
            batch = future.result()
            records.extend(batch)
            (DATA / 'catalogo-real.json').write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
    print('TOTAL', len(records))
