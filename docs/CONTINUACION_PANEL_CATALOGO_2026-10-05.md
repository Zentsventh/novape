# Continuación del panel y catálogo — 5 de octubre de 2026

## Correcciones aplicadas

- Compras y Almacenes dejaron de descargar el catálogo completo. Selectores protegidos por los permisos del módulo entregan 30 resultados por página, permiten buscar y cargar más, y conservan selecciones fuera de la página actual. Las peticiones obsoletas se cancelan.
- El filtro de variantes recorre todos los niveles de categorías, sin duplicar resultados por asociaciones múltiples. La transferencia muestra existencias descontando reservas vigentes del almacén web; la validación transaccional existente sigue siendo la autoridad al guardar.
- Compras selecciona la variante exacta. El costo se introduce expresamente: se eliminó la selección automática de la primera variante y la estimación porcentual presentada como costo. El formulario controla el envío y muestra errores. El historial de compras por producto tiene paginación propia.
- Pipeline usa búsquedas remotas para empresas y contactos; Tareas busca oportunidades remotamente. La búsqueda de contactos admite nombre y apellido juntos y entrega únicamente identificador y nombre.
- Se implementaron las rutas ausentes de edición y eliminación del pipeline. La edición registra cambios y conserva como valor el total de líneas cuando existe cotización. Eliminar archiva la oportunidad conservando cotizaciones, tareas y timeline. Las búsquedas excluyen archivadas y no se permiten nuevas asociaciones a oportunidades archivadas.
- Se agregó `panel:health --json`, con señales del scheduler y workers por conexión/cola, conteos de trabajos y estados de conciliaciones y entregas. No ejecuta trabajos, no imprime destinatarios ni secretos. Las señales caducan a los tres minutos.
- Se sustituyó el archivo marcador de fuente por Inter Variable válido, con su licencia SIL OFL. Se retiraron imports y enlaces a Google Fonts de la tienda, checkout y panel.
- Se retiró el caché de respuestas completas de catálogo/ficha que retenía fotografías antiguas, precios y stock durante una hora. Home guarda en caché únicamente conjuntos de IDs y consulta datos variables por lotes. El stock se refresca incluso al reutilizar el servicio, y los recomendados se formatean después de precargar sus existencias.
- La lectura de fotografías locales admite referencias JPG/PNG cuyos originales ya fueron convertidos y referencias compartidas movidas a otras carpetas. Conserva originales existentes y URLs externas; solo usa archivos locales comprobados.
- CI comprueba requisitos de plataforma y extractores EFE además de PHPUnit, análisis estático y build.

## Base de datos

La migración `2026_10_05_120000_preserve_archived_crm_deals` agrega `deleted_at` sin eliminar información. Se aplicó en MySQL local tras generar `storage/app/private/panel-backup-20261005-112147.sql`. El respaldo es privado y no se publica.

## Evidencia

| Comprobación | Resultado |
| --- | --- |
| PHPUnit | 112 pruebas y 401 assertions aprobadas; base SQLite aislada. |
| PHPStan/Larastan | Cero errores. |
| Extractores EFE | Cinco pruebas aprobadas, sin volver a consultar al proveedor. |
| Verificación de catálogo | 21 categorías principales, 9.416 productos y 28.248 fotografías; fichas, asociaciones, galerías e inventario/kardex coherentes con el snapshot importado. |
| Rutas administrativas | 74 respuestas 200 y una redirección 302 prevista en el recorrido posterior; las rutas nuevas tienen pruebas adicionales. |
| Navegador administrativo | 23 pantallas con 200, renderizadas, sin errores JavaScript ni fallos de scripts/estilos; Reverb local activo. |
| Build y Composer | Producción compilada; composer.json válido y requisitos de plataforma satisfechos. |
| Selector en navegador | Búsqueda Samsung, 30 variantes únicas y costo sin rellenar automáticamente; apertura de transferencias y selectores CRM comprobadas. |
| Lecturas simultáneas locales | 18 solicitudes con concurrencia de tres; todas 200. Payload máximo de variantes: 4.847 bytes; contactos: 1.965 bytes; empresas: 321 bytes. |
| Responsive de catálogo | Siete anchos entre 240 y 1.440 px sin desbordamiento ni buscador recortado. |
| Home | Cinco banners correctos; cinco anchos de 320 a 1.920 px, menú y filtros funcionales, sin desbordamiento. |
| Menú y galería EFE | Menú comprobado en cinco anchos, con 21 raíces y enlaces válidos; galería de tres imágenes locales y selección de miniatura comprobadas con red externa bloqueada. |

El reporte de lecturas simultáneas está en `storage/logs/panel-completion-browser.json`. Son tres muestras por ruta en el servidor PHP de desarrollo, con su cola de solicitudes: no equivalen a una prueba de capacidad, p95 de producción ni concurrencia comercial en MySQL. El hash de inventario verificado fue `89dfe0189e68bb009b20d4d4de23b176c02f6d64a4bacb8647f14043489b2e74`.

## Operación y límites

La configuración local encontrada usaba cola `sync`, correo `log` y broadcasting `log`. Se habilitó broadcasting `reverb` en `.env` y se inició Reverb en `127.0.0.1:8080`; se inició el scheduler local. Cola `sync` no requiere worker. No se activaron workers sobre colas comerciales ni se enviaron mensajes, campañas, cobros o documentos fiscales reales. Para producción deben configurarse cola durable, caché compartida y supervisión de los procesos documentados en README y verificarse los proveedores con sus credenciales. Los procesos locales iniciados no sustituyen un servicio del sistema que sobreviva a reinicios.

Durante la revisión se detectó `organizar.php`, un proceso paralelo que mueve imágenes a carpetas de categoría. No se detuvo ni se editó ese proceso. La verificación del snapshot EFE se realizó antes de esa reorganización; `scripts/verify_product_images.php` verifica las referencias efectivas actuales independientemente del nombre de la carpeta y genera `storage/logs/product-images-verification.json`.

El archivado no ofrece todavía una pantalla de restauración: el registro e historial permanecen en la base. No se auditó íntegramente el subproyecto chatbot. La revisión del catálogo usa el snapshot existente y no declara actuales los precios del proveedor ni vuelve a intentar cuotas agotadas en EFE.
