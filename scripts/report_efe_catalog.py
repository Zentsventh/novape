"""Generate an auditable coverage report from the exact EFE snapshot."""
from collections import Counter, defaultdict
import csv
import json
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'database/seed-data'
coverage = json.loads((DATA / 'efe-coverage.json').read_text(encoding='utf-8'))
catalog = json.loads((DATA / 'efe-catalog.json').read_text(encoding='utf-8'))
taxonomy = json.loads((DATA / 'efe-taxonomy.json').read_text(encoding='utf-8'))
rows = sorted(coverage['categories'], key=lambda item: item['path'])
statuses = Counter(row['status'] for row in rows)
photos = sum(len(record['image_paths']) for record in catalog)
def brand_key(name):
    return ''.join(char for char in unicodedata.normalize('NFKD', name.casefold()) if not unicodedata.combining(char))
brand_names = {brand_key(record['brand']) for record in catalog}
by_category = defaultdict(list)
for record in catalog:
    for category_url in record['category_urls']:
        by_category[category_url].append(record)

def missing_fields(records):
    return [sum(not p['description'] for p in records),
            sum(p['warranty'] in ('', 'No indicada por EFE') for p in records),
            sum(not p['specifications'] for p in records)]

missing_descriptions, missing_warranties, missing_specifications = missing_fields(catalog)
with (ROOT / 'docs/COBERTURA_EFE.csv').open('w', encoding='utf-8-sig', newline='') as handle:
    writer = csv.writer(handle, delimiter=';')
    writer.writerow(['Ruta EFE', 'Fuente', 'Marcas y productos con 3 fotos', 'Marcas faltantes para 5',
                     'Productos faltantes para 50', 'Estado', 'Páginas revisadas', 'Motivos de omisión',
                     'Descripciones sin texto', 'Garantías sin información', 'Fichas sin especificaciones'])
    for row in rows:
        writer.writerow([' > '.join(row['path']), row['category_url'],
                         ' | '.join(f'{brand}: {count}/10' for brand, count in row['brands'].items()),
                         row['missing_brands'], row['missing_products'], row['status'],
                         row.get('pages_scanned', 0), json.dumps(row.get('omitted', {'error': row.get('error', '')}), ensure_ascii=False),
                         *missing_fields(by_category[row['category_url']])])
lines = [
    '# Catálogo EFE y cobertura de la importación',
    '',
    f'Fuente: [Tiendas EFE](https://www.efe.com.pe/). Consulta: {coverage["collected_on"]}.',
    '',
    f'- {len(taxonomy["categories"])} categorías principales y {coverage["leaves_total"]} subcategorías finales; tres niveles conservados.',
    f'- {coverage["leaves_processed"]}/{coverage["leaves_total"]} subcategorías revisadas.',
    f'- {len(catalog)} productos únicos de {len(brand_names)} marcas; {photos} fotografías locales.',
    '- Se unifican mayúsculas y tildes al contar marcas (por ejemplo, Paraiso y Paraíso), conservando el nombre publicado en cada ficha.',
    f'- En los datos recopilados faltan {missing_descriptions} descripciones textuales, {missing_warranties} garantías y {missing_specifications} fichas de especificaciones. El contenido dinámico externo del fabricante queda fuera de esta extracción.',
    '- Cada producto admitido tiene al menos tres fotos originales distintas por URL y por contenido SHA-256.',
    '- Objetivo por subcategoría final: cinco marcas y diez productos distintos por marca. Se seleccionan las cinco marcas con mayor disponibilidad entre las fichas que cumplen el mínimo de fotos.',
    '- Cuando EFE no publica suficientes productos, marcas o fotos, se conserva la cantidad real y se registra el faltante; no se duplican productos ni fotografías para alcanzar la cuota.',
    '',
    '## Resultado de la revisión',
    '',
    '| Estado | Subcategorías |',
    '|---|---:|',
]
for status, count in sorted(statuses.items()):
    lines.append(f'| {status} | {count} |')
lines += [
    '',
    'complete: cinco marcas con diez productos válidos. source_exhausted: se recorrieron las listas publicadas sin alcanzar esa cuota. scan_limit: la lista supera el límite de páginas configurado, por lo que la revisión no es exhaustiva. fetch_error: la fuente no pudo consultarse; no equivale a catálogo vacío.',
    '',
    'El detalle de cada subcategoría, sus marcas, cantidades, URL y motivos de descarte está en [COBERTURA_EFE.csv](COBERTURA_EFE.csv). Los datos auditables están en database/seed-data/efe-taxonomy.json, efe-catalog.json y efe-coverage.json.',
    '',
    '## Inventario de Novape',
    '',
    'El stock es una estimación de Novape para 30 días, no el stock real de EFE. La rotación estimada por SKU depende del precio y del tipo de artículo: 1–2 unidades para productos desde S/ 5000; 2–4 desde S/ 2500; 2–5 para muebles y electrohogar voluminoso; 3–7 desde S/ 1000; 5–12 desde S/ 300; 8–20 desde S/ 80; y 15–35 para artículos económicos. Se añade un 25% de stock de seguridad, con mínimo de una unidad.',
    '',
    'Se sincronizan variante y almacén, se conserva el stock reservado y se registra el ajuste de entrada o salida en el kardex. Reejecutar la importación no reinicia existencias de productos que ya tienen su movimiento EFE, para conservar ventas posteriores. Los costos de compra son estimados al 72% del precio de venta. Los pedidos y ventas existentes se conservan.',
    '',
    '## Reproducción',
    '',
    '    python scripts/collect_efe_catalog.py --workers 8',
    '    python scripts/normalize_efe_snapshot.py',
    '    python scripts/report_efe_catalog.py',
    '    php artisan migrate',
    '    php artisan db:seed --class=EfeCatalogSeeder',
    '    php scripts/verify_efe_catalog.php',
    '    node scripts/check-efe-menu.mjs',
    '',
    'Las listas y fichas se almacenan comprimidas en storage/app/private/efe-catalog-cache para reanudar sin repetir descargas. Las fotos están en storage/app/public/productos/efe. Cada subcategoría se guarda en caché; los archivos combinados se publican cada diez subcategorías y al finalizar. La semilla valida los archivos locales antes de escribir en la base de datos y solo permite inventario estimado en local/testing.',
    '',
    'Para aplicar únicamente fichas modificadas frente a la última importación: ejecutar python scripts/prepare_efe_catalog_changes.py y luego php scripts/import_efe_catalog_changes.php storage/app/private/efe-changed-source-urls.json. Se valida y publica la copia completa del catálogo, conservando existencias inicializadas. Para restablecer también fichas editadas manualmente en la base de datos, ejecutar la semilla completa.',
    '',
    'La semilla anterior RealStoreMonthSeeder corresponde al lote histórico de clientes y ventas de septiembre/octubre. Para actualizar este catálogo se usa EfeCatalogSeeder; no se vuelve a generar el mes comercial para importar productos.',
]
(ROOT / 'docs/CATALOGO_EFE.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(json.dumps({'products': len(catalog), 'brands': len(brand_names), 'photos': photos, 'processed': coverage['leaves_processed'], 'total': coverage['leaves_total'], 'statuses': statuses}, ensure_ascii=False))
