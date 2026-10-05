"""Compare a complete EFE snapshot with the last imported snapshot."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
private = ROOT / 'storage/app/private'
catalog = json.loads((ROOT / 'database/seed-data/efe-catalog.json').read_text(encoding='utf-8'))
coverage = json.loads((ROOT / 'database/seed-data/efe-coverage.json').read_text(encoding='utf-8'))
if coverage['leaves_processed'] != coverage['leaves_total'] or coverage['products_unique'] != len(catalog):
    raise ValueError('Finish collecting the complete catalog first')
snapshot = private / 'efe-imported-catalog.json'
previous = {p['source_url']: p for p in json.loads(snapshot.read_text(encoding='utf-8'))} if snapshot.exists() else {}

def comparable(record):
    return {**record, 'category_urls': sorted(record['category_urls'])}

changed = [p['source_url'] for p in catalog
           if p['source_url'] not in previous or comparable(p) != comparable(previous[p['source_url']])]
output = private / 'efe-changed-source-urls.json'
output.write_text(json.dumps(changed, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'products': len(catalog), 'changed_products': len(changed)}, ensure_ascii=False))
