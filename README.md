# Novape

El [conocimiento del chatbot](docs/CONOCIMIENTO_CHATBOT.md) permite cargar texto, PDF, Word y archivos de texto desde Comunicación → Conocimiento del chatbot, revisar borradores y activar fuentes para las respuestas de tienda y WhatsApp.

Tienda y panel administrativo con Laravel 12, PHP 8.3 o superior, React 19, Inertia y Vite. Incluye catálogo, pedidos, inventario por almacén, compras, caja/POS, devoluciones, CRM, campañas y atención omnicanal.

## Instalación

Requiere Composer, Node.js 22 y MySQL o SQLite. Instalar dependencias desde `composer.lock`, sin copiar `vendor` de otro equipo.

```powershell
composer install
npm ci
Copy-Item .env.example .env
php artisan key:generate
```

Configurar en `.env` la base de datos, `APP_URL` y los servicios. En una instalación existente conservar `.env` y `APP_KEY`: esta clave protege también las credenciales cifradas del panel.

Antes de actualizar una base existente:

```powershell
php artisan store:database-backup --verify
php scripts/database-maintenance.php migrate
npm run build
```

El respaldo se guarda en `storage/app/private`, contiene datos privados y debe protegerse. La migración de endurecimiento conserva historial y no permite un rollback destructivo automático. Las sesiones antiguas de caja deben cerrarse y abrirse nuevamente seleccionando caja física con almacén.

Para desarrollo ejecutar en terminales separadas:

```powershell
php artisan serve
npm run dev
```

## Procesos operativos

Configurar `QUEUE_CONNECTION=database` o Redis en producción y mantener un worker supervisado. El scheduler debe ejecutarse cada minuto; Reverb proporciona actualizaciones del inbox.

```powershell
php artisan queue:work --timeout=60 --tries=1
php artisan queue:work storefront --queue=storefront --timeout=120 --tries=1
php artisan queue:work chatbot --queue=chatbot --timeout=900 --tries=1
php artisan schedule:work
php artisan reverb:start
```

Comprobar actividad y pendientes sin ejecutar trabajos ni enviar mensajes:

```powershell
php artisan panel:health --json
```

El comando devuelve código 1 si falta señal reciente del scheduler o de los workers necesarios, o si no puede consultar base/caché. Comprueba también las conexiones `storefront` y `chatbot` cuando la cola predeterminada es `sync`. Registra esperas, trabajos activos/fallidos y estados de conciliación y entregas. Las señales caducan a los tres minutos. En producción usar cola durable y caché compartida; mantener el scheduler activo. Un código 0 acredita actividad reciente, no entrega de proveedores ni salud de todos los nodos.

En desarrollo `npm start` inicia servidor, Vite, scheduler y los tres workers. En producción ejecutar `schedule:run` desde el programador del sistema y supervisar cada worker. El `retry_after` debe superar su timeout: `storefront` usa 180 segundos y `chatbot` 1020 segundos. Reiniciar workers después de actualizar código. Configurar `REVERB_*`, `VITE_REVERB_*` y el proxy WebSocket; recompilar cuando cambien las variables del frontend.

En **Tienda online → Operación de tienda** se resuelven pagos inciertos y tareas fallidas con evidencia del proveedor. **Información comercial** permite publicar contactos, condiciones y horario de retiro. El retiro solo se ofrece con almacén ecommerce activo, dirección y horario; completar dimensiones de embalaje en Productos para cotizaciones externas. Las reseñas publicadas requieren compra completada y moderación.

Las solicitudes de reembolso son registros internos: la devolución se ejecuta en Niubiz y después se confirma en el pedido con importe, referencia y evidencia. Se admite devolución parcial por RMA procesado. Las tarjetas guardadas permanecen deshabilitadas hasta disponer de tokenización contratada y documentación oficial de integración.

SMTP, WhatsApp/Meta, Niubiz y facturación electrónica requieren credenciales propias. El webhook exige secreto de firma válido y TLS debe verificarse. Una respuesta simulada o un correo en `log` no equivalen a entrega real. Revisar resultados inciertos antes de reenviar campañas, notificaciones o cobros.

## Verificación

```powershell
composer validate --strict
composer check-platform-reqs
php artisan test --compact
php vendor/bin/phpstan analyse --memory-limit=1G --no-progress
npm run build
```

Las pruebas fuerzan SQLite en memoria y correo de prueba para proteger datos y destinatarios reales. CI ejecuta estas comprobaciones con PHP 8.3 y 8.5.

La auditoría de rutas es de solo lectura:

```powershell
php scripts/audit_admin_pages.php
```

El recorrido de navegador requiere servidor local en `http://127.0.0.1:8000`, Chrome y Reverb. `scripts/admin_audit_session.php` crea una sesión temporal administrativa solo en entorno local; ejecutar su opción `cleanup` al terminar. Nunca publicar los archivos de sesiones.

La [auditoría inicial](docs/AUDITORIA_360_PANEL_2026-10-05.md) describe el estado anterior. Consultar [correcciones y límites de verificación](docs/CORRECCIONES_PANEL_2026-10-05.md). La carga de catálogo y datos de demostración se documenta en [SEMILLAS_REALES](docs/SEMILLAS_REALES.md).

La [continuación de pendientes](docs/CONTINUACION_PANEL_CATALOGO_2026-10-05.md) documenta las búsquedas remotas, edición y archivado del CRM, monitorización y comprobaciones adicionales de tienda. `node scripts/check-panel-completion.mjs` verifica selectores y 18 lecturas con concurrencia de tres contra el servidor local; crea y elimina una sesión temporal y no guarda compras ni envía comunicaciones.

`php scripts/verify_product_images.php` comprueba las galerías locales actuales tras conversiones o cambios de carpeta. `php scripts/verify_efe_catalog.php` contrasta además fichas, fotografías de origen e inventario con el snapshot EFE, admitiendo las rutas reorganizadas.

El [chat de trabajadores y asistente del panel](docs/COMUNICACION_PANEL_CRM_2026-10-05.md) documenta los espacios privados, la integración de borradores en Omnicanal CRM, los permisos y la recuperación de IA. `node scripts/check-panel-communication.mjs` valida chat directo y grupal con usuarios temporales, canales Reverb, borradores sin envío al cliente y diseño móvil.


Operación local: `powershell -ExecutionPolicy Bypass -File scripts/start-store-runtime.ps1` inicia MariaDB LTS, workers y scheduler ocultos. La conexión de ejecución tiene permisos DML; las migraciones usan la identidad de mantenimiento. Consultar `docs/SOLUCIONES_BASE_DATOS_2026-10-07.md` para respaldos, recuperación y pendientes de datos reales.
