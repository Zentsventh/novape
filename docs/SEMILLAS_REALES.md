# Catálogo real y actividad simulada de Novape

El catálogo actual se amplía con la estructura completa de EFE. Su cobertura, productos, fotografías y política de inventario mensual están documentados en [CATALOGO_EFE.md](CATALOGO_EFE.md), con faltantes por subcategoría en [COBERTURA_EFE.csv](COBERTURA_EFE.csv). Las cifras de 13 categorías, 129 productos y stock de 100–200 que aparecen abajo describen el lote inicial histórico; no son las cantidades del nuevo catálogo.

Las identidades (solo nombres y DNI) proceden del archivo suministrado por el usuario. Se conservaron ceros iniciales y se revisaron apellidos compuestos. Direcciones, teléfonos y correos son inventados: `primernombre.primerapellidoNNN@example.test`. No son datos de contacto verificados. Las cuentas de clientes tienen contraseñas aleatorias desconocidas.

## Contenido

- 200 personas en `usuario` y `clientes`, con rol cliente y dirección de prueba.
- 13 categorías, cada una con 10 referencias de EFE (129 productos distintos, uno compartido entre Audio y Smarthome).
- Precios en soles, precio habitual cuando está publicado, modelo, especificaciones y garantía disponible. Si el vendedor omite garantía, se indica expresamente. No se inventa cobertura.
- Una imagen descargada por producto en `storage/app/public/productos/catalogo-real`. El archivo JSON conserva URL de ficha, URL original de imagen y fecha de consulta: 4 de octubre de 2026.
- Subcategorías asociadas a los productos reales y marcas disponibles en cada categoría. `StoreNavigationSeeder` actualiza estas asociaciones sin duplicarlas.
- Cinco banners de la página principal de EFE, cada uno con sus versiones de escritorio y móvil descargadas en `storage/app/public/banners/efe`. Sus fuentes se conservan en `database/seed-data/banners-efe.json`.
- Stock final reproducible y aleatorio entre 100 y 200 unidades, tanto en variantes como en el almacén que usa la tienda.
- Actividad del **5 de septiembre al 4 de octubre de 2026**: 90 pedidos web, 60 ventas POS, pagos, envíos, comprobantes de prueba, reposición y cinco gastos operativos. Cinco transacciones por día, uno o dos artículos por transacción.
- 30 oportunidades CRM, actividades de seguimiento y ocho consultas posventa.

Los pedidos, compras, ventas, costos de adquisición, gastos, relaciones comerciales y comprobantes son **simulados**. No son operaciones reales de las personas ni empresas identificadas. Los costos se estiman al 72% del precio de venta. El inventario de apertura se registra fuera del mes; apertura + reposición − ventas coincide con el stock final. La compra del mes repone unidades vendidas. El stock inicial de 100–200 por referencia se mantiene por petición del usuario y no representa un inventario típico de una tienda pequeña.

RUC y razones sociales contrastados en sitios de las propias empresas:

- CONECTA RETAIL S.A., 20141189850: https://www.efe.com.pe/terminos-y-condiciones
- BANCO DE CREDITO DEL PERU S.A., 20100047218: https://www.viabcp.com/
- BANCO INTERNACIONAL DEL PERU S.A.A., 20100053455: https://interbank.pe/avisos-legales

## Ejecución

```powershell
php artisan migrate
php artisan storage:link
php scripts/seed_real_store.php
php scripts/verify_real_store.php
```

Requiere MySQL disponible y `APP_ENV=local` o `testing`. El script crea una clave aleatoria para `admin@novape.com` si no existe administrador y guarda las credenciales en `storage/app/private/demo-admin.txt`, fuera del directorio público y excluido de Git. Puede proporcionarse `DEMO_SEED_PASSWORD` (mínimo 12 caracteres) en el entorno. No cambia la contraseña de un administrador existente.

Alternativamente, ejecutar `php artisan db:seed --class=RealStoreMonthSeeder` con `DEMO_SEED_PASSWORD` configurada, o habilitar `APP_REAL_DEMO_SEED=true` para seleccionarlo mediante `DatabaseSeeder`. Este selector evita ejecutar el antiguo `MasterSeeder`, que trunca tablas y usa otro conjunto de datos.

`REAL_SEED_END_DATE=YYYY-MM-DD` cambia el cierre del mes simulado. Reejecutar actualiza exclusivamente el lote demo con códigos estables, sin duplicar actividad. No modifica personas preexistentes con el mismo DNI fuera del lote. No se emiten correos, WhatsApp, pagos a pasarelas ni comprobantes ante SUNAT. Los comprobantes quedan con `estado_sunat=simulado` y `facturado_sunat=false`.

Para volver a recopilar las fichas: `python scripts/collect_real_catalog.py` (biblioteca estándar, necesita conexión a Internet). Las imágenes ya descargadas se reutilizan. Las semillas usan el JSON local y no necesitan Internet. Precios y descuentos son una instantánea y pueden cambiar en el vendedor.

Para recopilar los banners: `python scripts/collect_efe_banners.py`. Para actualizar solo subcategorías y banners: `php artisan db:seed --class=StoreNavigationSeeder`. Los banners muestran las promociones de EFE; sus condiciones publicadas pertenecen a ese comercio.

La navegación usa un panel con subcategorías y marcas, con dos columnas en escritorio y una vista con botón de volver por debajo de 1024 píxeles. `node scripts/check-storefront.mjs` comprueba el sitio en `http://localhost:8000` a cinco anchos de pantalla y guarda capturas en `storage/app/private/storefront-qa`.

La tienda y sus dashboards utilizan el esquema español. Las tablas inglesas experimentales no son una réplica del catálogo ni de las ventas. Se corrigieron las migraciones pendientes de stock y almacenes y se eliminaron borrados destructivos de migraciones duplicadas de productos.

El catálogo muestra el descuento calculado a partir del precio habitual recopilado, sin porcentajes inventados. El ranking CRM se calcula con oportunidades ganadas y sus primeros autores de actividad (el esquema actual no incluye un vendedor asignado). Los productos más vendidos del dashboard general respetan el intervalo de fechas seleccionado.

Los archivos de identidades contienen DNI completos proporcionados por el usuario: mantenerlos en el proyecto privado.
