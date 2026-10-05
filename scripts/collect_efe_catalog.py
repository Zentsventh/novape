"""Resumable public EFE snapshot. Never manufactures products or photographs."""
import argparse
import concurrent.futures
from datetime import date
import gzip
import hashlib
import html
import http.client
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import threading
import time
import unicodedata
from urllib.parse import urljoin, urlsplit
from urllib.error import HTTPError

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'database/seed-data'
CACHE = ROOT / 'storage/app/private/efe-catalog-cache'
IMAGES = ROOT / 'storage/app/public/productos/efe'
BASE = 'https://www.efe.com.pe'
LOCK = threading.Lock()
URL_LOCKS = {}
HTTP_LOCAL = threading.local()
for folder in (DATA, CACHE, IMAGES):
    folder.mkdir(parents=True, exist_ok=True)

def clean(value):
    value = '' if value is None else str(value)
    value = re.sub(r'<(script|style)\b[^>]*>.*?</\1\s*>', ' ', value, flags=re.S | re.I)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', value))).strip()

def save(path, value):
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')
    # Windows readers/antivirus can briefly prevent replacing an open snapshot.
    for attempt in range(30):
        try:
            temporary.replace(path)
            return
        except PermissionError:
            if attempt == 29:
                raise
            time.sleep(0.1)

def fetch(url):
    if urlsplit(url).hostname != 'www.efe.com.pe':
        raise ValueError('Only EFE sources allowed')
    for attempt in range(3):
        try:
            connection = getattr(HTTP_LOCAL, 'connection', None)
            if connection is None:
                connection = HTTP_LOCAL.connection = http.client.HTTPSConnection('www.efe.com.pe', timeout=25)
            parsed = urlsplit(url)
            path = parsed.path or '/'
            if parsed.query:
                path += '?' + parsed.query
            connection.request('GET', path, headers={'User-Agent': 'Mozilla/5.0', 'Accept-Encoding': 'gzip', 'Connection': 'keep-alive'})
            response = connection.getresponse()
            result = response.read()
            if response.will_close:
                connection.close()
                HTTP_LOCAL.connection = None
            if response.status in (301, 302, 303, 307, 308):
                return fetch(urljoin(url, response.getheader('Location', '')))
            if response.status >= 400:
                raise HTTPError(url, response.status, response.reason, response.headers, None)
            if response.getheader('Content-Encoding', '').lower() == 'gzip':
                result = gzip.decompress(result)
            time.sleep(0.08)
            return result
        except Exception:
            connection = getattr(HTTP_LOCAL, 'connection', None)
            if connection:
                connection.close()
                HTTP_LOCAL.connection = None
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))

def page(url):
    target = CACHE / (hashlib.sha256(url.encode()).hexdigest() + '.html.gz')
    if target.exists():
        return gzip.decompress(target.read_bytes()).decode('utf-8')
    body = fetch(url)
    target.write_bytes(gzip.compress(body))
    return body.decode('utf-8')

class MenuParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.roots = []
        self.capture = None

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'li':
            classes = attrs.get('class', '').split()
            level = next((int(c[-1]) for c in classes if c in ('level0', 'level1', 'level2')), None)
            node = None
            if 'category-item' in classes and level is not None:
                node = {'name': '', 'url': '', 'children': [], 'level': level}
                parent = next((item for item in reversed(self.stack) if item), None)
                if parent:
                    parent['children'].append(node)
                elif level == 0:
                    self.roots.append(node)
            self.stack.append(node)
        if tag == 'a' and self.stack and self.stack[-1] and not self.stack[-1]['url']:
            self.stack[-1]['url'] = urljoin(BASE, attrs.get('href', ''))
        if tag == 'span' and 'cat-name' in attrs.get('class', '').split() and self.stack and self.stack[-1]:
            if not self.stack[-1]['name']:
                self.capture = self.stack[-1]

    def handle_data(self, text):
        if self.capture is not None:
            self.capture['name'] += text

    def handle_endtag(self, tag):
        if tag == 'span':
            self.capture = None
        if tag == 'li' and self.stack:
            self.stack.pop()

class ListingParser(HTMLParser):
    """Read whole product cards, including nested image/swatch lists."""
    def __init__(self):
        super().__init__()
        self.started = False
        self.ol_depth = 0
        self.li_depth = 0
        self.card = None
        self.brand_capture = False
        self.products = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        classes = attrs.get('class', '').split()
        if tag == 'ol':
            if not self.started and {'products', 'list', 'items', 'product-items'}.issubset(classes):
                self.started = True
                self.ol_depth = 1
            elif self.ol_depth:
                self.ol_depth += 1
        if not self.ol_depth:
            return
        if tag == 'li':
            if self.card is None and 'product-item' in classes:
                self.card = {'url': '', 'brand': ''}
                self.li_depth = 1
            elif self.card is not None:
                self.li_depth += 1
        if self.card is not None:
            if tag == 'a' and 'product-item-link' in classes:
                self.card['url'] = urljoin(BASE, attrs.get('href', ''))
            if tag == 'span' and 'brand-name' in classes:
                self.brand_capture = True

    def handle_data(self, value):
        if self.card is not None and self.brand_capture:
            self.card['brand'] += value

    def handle_endtag(self, tag):
        if tag == 'span':
            self.brand_capture = False
        if tag == 'li' and self.card is not None:
            self.li_depth -= 1
            if self.li_depth == 0:
                if self.card['url']:
                    self.card['brand'] = clean(self.card['brand'])
                    self.products.append(self.card)
                self.card = None
        if tag == 'ol' and self.ol_depth:
            self.ol_depth -= 1

def taxonomy():
    parser = MenuParser()
    parser.feed(page(BASE + '/'))
    roots, seen = [], set()
    for node in parser.roots:
        if not node['name'] or node['url'] in seen:
            continue
        seen.add(node['url'])
        roots.append(node)
    if len(roots) < 10:
        raise ValueError('Incomplete source menu; refusing to replace taxonomy')
    save(DATA / 'efe-taxonomy.json', {'source_url': BASE + '/', 'collected_on': str(date.today()), 'categories': roots})
    return roots

def leaves(nodes, ancestors=()):
    for node in nodes:
        path = ancestors + (node,)
        if node['children']:
            yield from leaves(node['children'], path)
        else:
            yield path

def product_schema(source):
    fact = None
    for block in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', source, re.S):
        try:
            data = json.loads(block)
            nodes = data if isinstance(data, list) else data.get('@graph', [data])
            fact = next((item for item in nodes if item.get('@type') == 'Product'), fact)
        except (ValueError, AttributeError):
            continue
    if not fact:
        raise ValueError('No product structured data')
    return fact

def product_specifications(source, fact):
    specifications = {}
    table = re.search(r'<table[^>]*id="product-attribute-specs-table"[^>]*>(.*?)</table>', source, re.S)
    if table:
        specifications = {clean(k): clean(v) for k, v in re.findall(r'<th[^>]*>(.*?)</th>\s*<td[^>]*>(.*?)</td>', table[1], re.S)}
    for item in fact.get('additionalProperty', []):
        specifications.setdefault(clean(item.get('name', '')), clean(item.get('value', '')))
    return specifications

def facts(url):
    with LOCK:
        lock = URL_LOCKS.setdefault(url, threading.Lock())
    with lock:
        cache = CACHE / (hashlib.sha256(url.encode()).hexdigest() + '.json')
        if cache.exists():
            return json.loads(cache.read_text(encoding='utf-8'))
        source = page(url)
        fact = product_schema(source)
        offers = fact.get('offers', {})
        if isinstance(offers, list):
            offers = offers[0] if offers else {}
        if float(offers.get('price', 0)) <= 0 or offers.get('priceCurrency') != 'PEN':
            raise ValueError('No published price in PEN')
        gallery = []
        for block in re.findall(r'<script[^>]*type="text/x-magento-init"[^>]*>(.*?)</script>', source, re.S):
            try:
                data = json.loads(block)
                for settings in data.values():
                    if isinstance(settings, dict) and 'mage/gallery/gallery' in settings:
                        gallery = settings['mage/gallery/gallery'].get('data', [])
            except ValueError:
                continue
        image_urls = list(dict.fromkeys(urlsplit(item.get('full') or item.get('img', '')).path
                         for item in gallery if item.get('type') == 'image'))
        image_urls = [urljoin(BASE, path) for path in image_urls if path.startswith('/media/catalog/product/')]
        specifications = product_specifications(source, fact)
        brand = fact.get('brand', {})
        brand = clean(brand.get('name', '') if isinstance(brand, dict) else brand)
        price = float(offers['price'])
        old = re.search(r'data-price-amount="([\d.]+)"\s*data-price-type="oldPrice"', source)
        record = {'source_url': url, 'name': clean(fact['name']), 'brand': brand, 'model': str(fact.get('sku', '')),
                  'description': clean(fact.get('description', '')), 'specifications': specifications,
                  'warranty': next((v for k, v in specifications.items() if k.lower().startswith('garant')), 'No indicada por EFE'),
                  'price': price, 'previous_price': max(price, float(old[1])) if old else price,
                  'currency': 'PEN', 'image_source_urls': image_urls, 'collected_on': str(date.today())}
        save(cache, record)
        return record

def download_images(record):
    paths, hashes = [], set()
    for url in record['image_source_urls'][:8]:
        extension = Path(urlsplit(url).path).suffix.lower()
        if extension not in ('.jpg', '.jpeg', '.png', '.webp'):
            continue
        filename = hashlib.sha256(url.encode()).hexdigest()[:24] + extension
        target = IMAGES / filename
        body = target.read_bytes() if target.exists() else fetch(url)
        if not (body.startswith(b'\xff\xd8') or body.startswith(b'\x89PNG') or body.startswith(b'RIFF')):
            continue
        digest = hashlib.sha256(body).hexdigest()
        if digest in hashes:
            continue
        hashes.add(digest)
        if not target.exists():
            target.write_bytes(body)
        paths.append('productos/efe/' + filename)
        if len(paths) == 3:
            break
    if len(paths) < 3:
        raise ValueError('Fewer than 3 distinct downloadable photographs')
    return {**record, 'image_paths': paths}

def brand_key(name):
    return ''.join(char for char in unicodedata.normalize('NFKD', name.casefold()) if not unicodedata.combining(char))

def collect(path, max_pages):
    url = path[-1]['url']
    output = CACHE / (hashlib.sha256(url.encode()).hexdigest() + '.category.json')
    if output.exists():
        cached = json.loads(output.read_text(encoding='utf-8'))
        if cached.get('version') == 5:
            return cached
        if cached.get('version') == 4 and len({brand_key(name) for name in cached['brands']}) == len(cached['brands']):
            cached['version'] = 5
            save(output, cached)
            return cached
    seen, accepted, groups, omitted, brand_names = set(), [], {}, {}, {}
    pages, exhausted = 0, False
    for number in range(1, max_pages + 1):
        source = page(url + ('&' if '?' in url else '?') + 'p=' + str(number))
        pages += 1
        listing = ListingParser()
        listing.feed(source)
        links = {card['url']: card['brand'] for card in listing.products if card['url'] not in seen}
        if not links:
            exhausted = True
            break
        seen.update(links)
        for link, listed_brand in links.items():
            try:
                if listed_brand and groups.get(brand_key(listed_brand), 0) >= 10:
                    continue
                record = facts(link)
                if 'select' in record['brand'].lower():
                    record = {**record, 'brand': listed_brand}
                if not record['brand'] or record['brand'].lower() == 'sin marca':
                    raise ValueError('Brand not published')
                if 'select' in record['brand'].lower():
                    raise ValueError('Brand placeholder, not a published brand')
                key = brand_key(record['brand'])
                if groups.get(key, 0) >= 10:
                    continue
                if len(record['image_source_urls']) < 3:
                    raise ValueError('Fewer than 3 source photographs')
                record = download_images(record)
                accepted.append(record)
                groups[key] = groups.get(key, 0) + 1
                brand_names.setdefault(key, record['brand'])
            except Exception as error:
                reason = str(error)
                omitted[reason] = omitted.get(reason, 0) + 1
        print('SCAN', url, 'page', number, 'references', len(seen), 'eligible', len(accepted),
              'brands', len(groups), 'full_brands', sum(count >= 10 for count in groups.values()), flush=True)
        if sum(count >= 10 for count in groups.values()) >= 5:
            break
        if not re.search(r'class="[^"]*action\s+next|class="[^"]*next\s+action', source):
            exhausted = True
            break
    chosen = sorted(groups, key=lambda brand: (-groups[brand], brand))[:5]
    accepted = [record for record in accepted if brand_key(record['brand']) in chosen]
    result = {'version': 5, 'category_url': url, 'path': [node['name'] for node in path],
              'ancestor_urls': [node['url'] for node in path], 'products': accepted,
              'brands': {brand_names[brand]: groups[brand] for brand in chosen}, 'missing_brands': max(0, 5-len(chosen)),
              'missing_products': 50-len(accepted), 'omitted': omitted, 'pages_scanned': pages,
              'status': 'complete' if len(accepted) == 50 else ('source_exhausted' if exhausted else 'scan_limit')}
    save(output, result)
    return result

def main():
    arguments = argparse.ArgumentParser()
    arguments.add_argument('--max-pages', type=int, default=100)
    arguments.add_argument('--workers', type=int, default=4)
    arguments.add_argument('--taxonomy-only', action='store_true')
    args = arguments.parse_args()
    roots = taxonomy()
    paths = list(leaves(roots))
    print('TAXONOMY', len(roots), 'roots;', len(paths), 'leaves', flush=True)
    if args.taxonomy_only:
        return
    results, products = [], {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(collect, path, args.max_pages): path for path in paths}
        for future in concurrent.futures.as_completed(futures):
            path = futures[future]
            try:
                result = future.result()
            except Exception as error:
                result = {'category_url': path[-1]['url'], 'path': [n['name'] for n in path], 'products': [],
                          'brands': {}, 'missing_brands': 5, 'missing_products': 50, 'status': 'fetch_error', 'error': str(error)}
            for record in result.pop('products'):
                current = products.setdefault(record['source_url'], {**record, 'category_urls': []})
                for category_url in result['ancestor_urls']:
                    if category_url not in current['category_urls']:
                        current['category_urls'].append(category_url)
            results.append(result)
            # Each category is already cached; batch the large combined files.
            if len(results) % 10 == 0 or len(results) == len(paths):
                save(DATA / 'efe-catalog.json', list(products.values()))
                save(DATA / 'efe-coverage.json', {'source': BASE, 'collected_on': str(date.today()),
                     'requested': {'brands_per_leaf': 5, 'products_per_brand': 10, 'photos_per_product': 3},
                     'leaves_total': len(paths), 'leaves_processed': len(results), 'products_unique': len(products), 'categories': results})
            print('PROGRESS', len(results), '/', len(paths), 'products', len(products), result['category_url'], result['status'], flush=True)
    print('DONE', len(products), 'distinct products;', len(results), 'leaf reports', flush=True)

if __name__ == '__main__':
    main()
