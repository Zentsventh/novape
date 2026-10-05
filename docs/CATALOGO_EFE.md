# Catálogo EFE y cobertura de la importación

Fuente: [Tiendas EFE](https://www.efe.com.pe/). Consulta: 2026-10-04.

- 21 categorías principales y 595 subcategorías finales; tres niveles conservados.
- 595/595 subcategorías revisadas.
- 9416 productos únicos de 512 marcas; 28248 fotografías locales.
- Se unifican mayúsculas y tildes al contar marcas (por ejemplo, Paraiso y Paraíso), conservando el nombre publicado en cada ficha.
- En los datos recopilados faltan 128 descripciones textuales, 5112 garantías y 0 fichas de especificaciones. El contenido dinámico externo del fabricante queda fuera de esta extracción.
- Cada producto admitido tiene al menos tres fotos originales distintas por URL y por contenido SHA-256.
- Objetivo por subcategoría final: cinco marcas y diez productos distintos por marca. Se seleccionan las cinco marcas con mayor disponibilidad entre las fichas que cumplen el mínimo de fotos.
- Cuando EFE no publica suficientes productos, marcas o fotos, se conserva la cantidad real y se registra el faltante; no se duplican productos ni fotografías para alcanzar la cuota.

## Resultado de la revisión

| Estado | Subcategorías |
|---|---:|
| complete | 61 |
| source_exhausted | 534 |

complete: cinco marcas con diez productos válidos. source_exhausted: se recorrieron las listas publicadas sin alcanzar esa cuota. scan_limit: la lista supera el límite de páginas configurado, por lo que la revisión no es exhaustiva. fetch_error: la fuente no pudo consultarse; no equivale a catálogo vacío.

El detalle de cada subcategoría, sus marcas, cantidades, URL y motivos de descarte está en [COBERTURA_EFE.csv](COBERTURA_EFE.csv). Los datos auditables están en database/seed-data/efe-taxonomy.json, efe-catalog.json y efe-coverage.json.

## Inventario de Novape

El stock es una estimación de Novape para 30 días, no el stock real de EFE. La rotación estimada por SKU depende del precio y del tipo de artículo: 1–2 unidades para productos desde S/ 5000; 2–4 desde S/ 2500; 2–5 para muebles y electrohogar voluminoso; 3–7 desde S/ 1000; 5–12 desde S/ 300; 8–20 desde S/ 80; y 15–35 para artículos económicos. Se añade un 25% de stock de seguridad, con mínimo de una unidad.

Se sincronizan variante y almacén, se conserva el stock reservado y se registra el ajuste de entrada o salida en el kardex. Reejecutar la importación no reinicia existencias de productos que ya tienen su movimiento EFE, para conservar ventas posteriores. Los costos de compra son estimados al 72% del precio de venta. Los pedidos y ventas existentes se conservan.

## Reproducción

    python scripts/collect_efe_catalog.py --workers 8
    python scripts/normalize_efe_snapshot.py
    python scripts/report_efe_catalog.py
    php artisan migrate
    php artisan db:seed --class=EfeCatalogSeeder
    php scripts/verify_efe_catalog.php
    node scripts/check-efe-menu.mjs

Las listas y fichas se almacenan comprimidas en storage/app/private/efe-catalog-cache para reanudar sin repetir descargas. Las fotos están en storage/app/public/productos/efe. Cada subcategoría se guarda en caché; los archivos combinados se publican cada diez subcategorías y al finalizar. La semilla valida los archivos locales antes de escribir en la base de datos y solo permite inventario estimado en local/testing.

Para aplicar únicamente fichas modificadas frente a la última importación: ejecutar python scripts/prepare_efe_catalog_changes.py y luego php scripts/import_efe_catalog_changes.php storage/app/private/efe-changed-source-urls.json. Se valida y publica la copia completa del catálogo, conservando existencias inicializadas. Para restablecer también fichas editadas manualmente en la base de datos, ejecutar la semilla completa.

La semilla anterior RealStoreMonthSeeder corresponde al lote histórico de clientes y ventas de septiembre/octubre. Para actualizar este catálogo se usa EfeCatalogSeeder; no se vuelve a generar el mes comercial para importar productos.
