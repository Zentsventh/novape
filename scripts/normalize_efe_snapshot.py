"""Re-extract display text from cached EFE HTML; preserve prices, photos and identity."""
from concurrent.futures import ThreadPoolExecutor
import gzip
import hashlib
import json
import collect_efe_catalog as efe


def display_fields(record):
    path = efe.CACHE / (hashlib.sha256(record['source_url'].encode()).hexdigest() + '.html.gz')
    if not path.is_file():
        raise ValueError('Missing original EFE HTML: ' + record['source_url'])
    source = gzip.decompress(path.read_bytes()).decode('utf-8')
    fact = efe.product_schema(source)
    specifications = efe.product_specifications(source, fact)
    return {'name': efe.clean(fact['name']), 'description': efe.clean(fact.get('description', '')),
            'specifications': specifications,
            'warranty': next((v for k, v in specifications.items() if k.lower().startswith('garant')), 'No indicada por EFE')}


def main():
    coverage = json.loads((efe.DATA / 'efe-coverage.json').read_text(encoding='utf-8'))
    catalog = json.loads((efe.DATA / 'efe-catalog.json').read_text(encoding='utf-8'))
    if coverage['leaves_processed'] != coverage['leaves_total'] or coverage['products_unique'] != len(catalog):
        raise ValueError('Finish the collection before normalizing its snapshot')
    with ThreadPoolExecutor(max_workers=8) as pool:
        fields = list(pool.map(display_fields, catalog))
    corrected, descriptions, specifications = {}, 0, 0
    for record, values in zip(catalog, fields):
        if all(record[key] == value for key, value in values.items()):
            continue
        descriptions += record['description'] != values['description']
        specifications += record['specifications'] != values['specifications']
        record.update(values)
        corrected[record['source_url']] = values
        cache_path = efe.CACHE / (hashlib.sha256(record['source_url'].encode()).hexdigest() + '.json')
        if cache_path.is_file():
            cached = json.loads(cache_path.read_text(encoding='utf-8'))
            cached.update(values)
            efe.save(cache_path, cached)
    for path in efe.CACHE.glob('*.category.json'):
        cached = json.loads(path.read_text(encoding='utf-8'))
        changed = False
        for record in cached.get('products', []):
            if record['source_url'] in corrected:
                record.update(corrected[record['source_url']])
                changed = True
        if changed:
            efe.save(path, cached)
    efe.save(efe.DATA / 'efe-catalog.json', catalog)
    print(json.dumps({'products': len(catalog), 'corrected_products': len(corrected),
                      'description_changes': descriptions, 'specification_changes': specifications}))


if __name__ == '__main__':
    main()
