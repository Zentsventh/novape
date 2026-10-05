# Auditoría 360 del panel Novape

Este informe conserva el diagnóstico inicial. Las correcciones posteriores están documentadas en [CORRECCIONES_PANEL_2026-10-05.md](CORRECCIONES_PANEL_2026-10-05.md).

Fecha: 5 de octubre de 2026. Revisión del código y verificaciones locales del estado actual; no se aplicaron correcciones funcionales.

## Dictamen

El panel tiene una base funcional y varias protecciones útiles: autenticación administrativa separada, permisos por módulo, bloqueo de trabajadores inactivos, transacciones, bloqueo de filas en ventas y compras, exportaciones CSV por bloques y pruebas de integridad. Sin embargo, todavía existen fallos de autorización, trazabilidad y lógica comercial que impiden considerar fiables todos sus flujos operativos y reportes.

La prioridad debe ser cerrar accesos indebidos y preservar inventario/pagos; después corregir métricas y completar la operación multialmacén. Un rediseño visual por sí solo no resuelve esos problemas.

## Alcance y evidencia

Se revisaron rutas, middleware, modelos, requests, controladores, servicios y componentes del dashboard, analíticas, catálogo, clientes, trabajadores, roles, ajustes, pedidos, reembolsos, RMA, POS, cajas, compras, almacenes, marketing, CRM y omnicanal, junto con checkout/pagos que alimentan el panel. Se contrastaron las auditorías del 4 de octubre con la implementación actual. El submódulo chatbot solo recibió una inspección puntual de su superficie de despliegue; no se auditó íntegramente.

Verificaciones ejecutadas:

| Comprobación | Resultado actual |
| --- | --- |
| `php vendor/bin/phpunit` | 76 pruebas y 267 assertions aprobadas |
| `npm.cmd run build` | Compilación correcta; 3.624 módulos transformados |
| `php scripts/audit_admin_pages.php` | 66 respuestas HTTP 200 y una 302 antes de abortar por error fatal al exportar Excel; no completó el recorrido |
| Tres reproducciones adicionales en SQLite en memoria | 3 pruebas y 8 assertions: ampliación de permisos, transferencia de stock reservado y hashes/actor de auditoría |
| PHPStan/Larastan | No pudo iniciar: falta `vendor/larastan/larastan/extension.neon`; no se presenta el conteo anterior como un resultado actual |
| `composer audit --locked` | Sin avisos de vulnerabilidades ni paquetes abandonados reportados |
| `npm.cmd audit --json` | Cero vulnerabilidades reportadas |

Los archivos de reproducción están en `storage/logs/Audit360AccessProofTest.php` y `storage/logs/Audit360InventoryProofTest.php`. Ejecutar únicamente los nuevos casos con:

```powershell
php vendor/bin/phpunit --filter test_audit360 storage/logs/Audit360AccessProofTest.php storage/logs/Audit360InventoryProofTest.php
```

Estas pruebas afirman el comportamiento problemático para demostrarlo; sus resultados aprobados NO significan que el problema esté resuelto. Los logs y reproducciones bajo storage no sustituyen pruebas de regresión versionadas.

No hubo certificación visual en navegador, pruebas de carga o concurrencia real en MySQL, migración completa desde una base vacía ni validación con SUNAT/Niubiz/SMTP/Meta reales. Los HTTP 200 acreditan respuesta, no que todas las interacciones sean correctas. Las revisiones de dependencias no certifican la seguridad de la lógica propia. No se enviaron campañas ni se ejecutaron cobros, reembolsos o documentos fiscales reales.

## Hallazgos prioritarios

### A01 — Alta: un trabajador puede concederse permisos que no tenía

**Evidencia:** `routes/web.php`, grupo `/admin/roles`; `app/Services/Admin/Roles/RolePermissionService.php:43`; `app/Http/Requests/Admin/Roles/UpdateRoleRequest.php`. La ruta exige `usuarios.gestionar`, pero el servicio permite sincronizar cualquier permiso existente en un rol, incluso el propio. Las protecciones de `UserManagementService` impiden asignar el rol llamado admin; no impiden ampliar otros roles.

**Reproducción:** un supervisor con solo `usuarios.gestionar` envía un PUT a su rol agregando `finanzas.gestionar`; recibe redirección satisfactoria y obtiene el permiso. La ruta alternativa de sincronización en ajustes también necesita una política explícita.

**Corrección:** separar administración de cuentas y administración de privilegios. Restringir delegación a administradores o aplicar un conjunto máximo de permisos delegables y proteger roles de igual/mayor privilegio. Registrar antes/después. **Aceptación:** un supervisor no puede ampliar su rol ni otro rol por encima de su autoridad; ambos caminos rechazan la solicitud.

### A02 — Alta: autorización incompleta sobre conversaciones

**Evidencia:** `app/Http/Controllers/Api/Omnichannel/ConversationApiController.php:181`, `:219`, `:236`, `:318`. Listado, mensajes y envío comprueban asignación; asignar, desasignar, resolver, reabrir, notas y perfil no aplican uniformemente esa restricción. El permiso general de omnicanal permite llegar a esos endpoints.

**Impacto:** un asesor puede consultar datos del contacto de otra conversación o modificar su atención conociendo el ID. La asignación solo verifica que el usuario exista; no exige que sea asesor activo.

**Corrección:** una policy compartida por acción y conversación, más permisos específicos de supervisión. **Aceptación:** el asesor A recibe 403 en lecturas y acciones sobre conversaciones de B; asignar a clientes o trabajadores bloqueados se rechaza.

### A03 — Alta: el WebSocket comparte mensajes entre asesores

**Evidencia:** `routes/channels.php`; `app/Events/Omnichannel/NewMessageReceived.php:38`; `ConversationUpdated.php:49`. Todos los trabajadores autorizados escuchan `novape-inbox`; los eventos contienen texto, notas internas, nombre y teléfono de conversaciones sin comprobar su asignación.

**Impacto:** cuando broadcasting está operativo, la restricción de la API no protege los datos publicados por ese canal. Filtrar en React no evita que el navegador ya los reciba.

**Corrección:** canales privados por conversación o destinatario y canal separado para supervisores. **Aceptación:** un asesor no recibe en la red eventos de conversaciones ajenas; los cambios de asignación actualizan el acceso.

### A04 — Alta: hashes de contraseñas y actor ausente en auditoría

**Evidencia:** `config/audit.php` establece `strict=false`, `exclude=[]` y guards `web/api`; falta `admin`. `Usuario` oculta `password_hash` en serialización, pero el trait de auditoría instalado solo respeta hidden al activar strict. `AuditLogController` devuelve las auditorías a la interfaz.

**Reproducción:** `Usuario::toAudit()` tras cambiar la contraseña incluye los hashes anterior/nuevo y devuelve `user_id=null` aunque exista una sesión admin.

**Corrección:** excluir expresamente contraseñas/tokens, resolver actor con admin y minimizar el payload de la interfaz. Revisar registros históricos sensibles con una política de conservación definida. **Aceptación:** el cambio se atribuye al administrador y ningún hash aparece en el registro o respuesta.

### A05 — Alta: exportar Excel provoca un error fatal

**Evidencia ejecutada:** `app/Exports/DashboardExport.php:25` define `styles(Worksheet $sheet)` sin retorno; la interfaz instalada exige `: ?array`. `/admin/pedidos/exportar-excel` abortó la auditoría local al cargar la clase.

**Corrección:** declarar un retorno compatible, por ejemplo `: array`, y comprobar el archivo generado. **Aceptación:** descarga XLSX válida y prueba de ruta que cargue la clase; la suite existente no detecta este fallo.

### A06 — Alta: pedidos sin máquina de estados coherente

**Evidencia:** `app/Http/Requests/UpdateOrderStateRequest.php`; `app/Services/Orders/UpdateOrderStatusService.php:33`; `app/Services/Checkout/CheckoutService.php`. El request admite varios estados; el servicio protege cancelaciones/reapertura, pero no verifica todas las transiciones ni exige pago confirmado antes de procesar, enviar o completar.

**Impacto deducido del flujo:** se puede pasar un pendiente a procesando y luego cancelarlo. La cancelación repone inventario por el estado anterior aunque el stock solo se descontó al confirmar el pago. Volver un pagado a pendiente también puede desalinear callback, pago e inventario. Este escenario no se reprodujo contra datos reales.

**Corrección:** separar estado del pago, preparación y entrega; validar transiciones bajo bloqueo. Reponer según movimientos efectivamente consumidos, no inferirlo del texto del estado. **Aceptación:** un pedido impago no genera salida/reposición ficticia; repetir una transición no duplica sus efectos.

### A07 — Alta: transferencias y ajustes no respetan reservas web

**Evidencia:** `WarehouseService.php:104` compara cantidad física; `ProductManagementService.php` comprueba que el ajuste no sea negativo. Ninguno descuenta reservas activas, a diferencia de POS.

**Reproducción:** con cinco unidades físicas y cinco reservadas, la transferencia de las cinco se acepta; el almacén queda en cero y la reserva permanece.

**Corrección:** centralizar disponible = físico − reservado y aplicarlo en todos los retiros/ajustes, o permitir liberación de reservas mediante un flujo explícito. **Aceptación:** ningún retiro consume stock comprometido sin resolver sus reservas.

### A08 — Alta: caja, sucursal y almacén del POS están desconectados

**Evidencia:** `CashFlowService.php:11` abre sesión solo con cajero/monto; `OpenCashRegisterRequest` no recibe caja. `PosService.php:24` intenta leer `caja_id` y cae silenciosamente al almacén 1. No se encontró una migración que agregue `caja_id` a `cajas_sesiones`.

**Impacto:** el flujo normal de apertura no permite seleccionar una caja física y puede descontar inventario del almacén equivocado.

**Corrección:** persistir caja física y almacén autorizado en la sesión, exigir configuración válida y bloquear ventas si no existe. **Aceptación:** vender en sucursal B afecta solo su almacén; no existe respaldo silencioso a 1.

### A09 — Alta: POS sin idempotencia y descuentos sin autoridad diferenciada

**Evidencia:** `PosService.php:90`, `ProcessPosSaleRequest.php`. La venta no recibe una clave de operación única. La misma solicitud válida crea otra venta si hay stock. `pos.vender` permite aplicar descuentos hasta el total sin un permiso o límite adicional.

**Corrección:** clave idempotente con restricción única y respuesta recuperable; política de descuentos y autorización de supervisor según importe. **Aceptación:** reenviar la solicitud devuelve la misma venta; exceder el descuento permitido se rechaza.

### A10 — Alta: cupones y puntos pueden excederse entre pedidos

**Evidencia:** `CheckoutService.php:55`, `:268`, `:275`. Cupón por cliente consulta únicamente estado `Pagado`; tras enviar/completar ese pedido deja de ser detectado. Límite de usos y saldo de puntos se calculan antes de pagar y no se revalidan bajo bloqueo al consumirlos.

**Impacto:** pedidos diferentes pendientes pueden prometer los mismos puntos o el último uso del cupón. La actualización atómica del contador por sí sola no impone el límite.

**Corrección:** ledger de consumo/reserva por usuario/pedido; comprobación bajo bloqueo y estados elegibles completos. **Aceptación:** dos pagos competidores no superan límite ni dejan saldo negativo; un cupón único sigue usado después de entregar el pedido.

## Exactitud comercial y de reportes

### A11 — Alta: «ganancia neta» usa una fórmula inadecuada

**Evidencia:** `app/Services/Admin/Dashboard/AnalyticsService.php:68–72`: ventas − compras completadas − gastos. Comprar inventario no equivale al costo de los artículos vendidos, ni completar una compra acredita que se haya pagado.

**Corrección:** presentar esta resta con una descripción precisa mientras se implementa costo histórico de venta, descuentos, devoluciones y gastos atribuibles. Si se presenta flujo de caja, calcular cobros y pagos efectivos. **Aceptación:** comprar mercadería sin venderla no reduce una supuesta utilidad por costo de venta.

### A12 — Alta: ventas desaparecen al pasar a procesando

**Evidencia:** dashboard agrega pagado/enviado/completado, omite procesando; analíticas y top productos usan otros criterios como solo completado.

**Corrección:** definición compartida de ingresos por pago/canal, independiente de preparación logística. Normalizar estados con enums y una migración revisada. **Aceptación:** mover un pedido cobrado a procesando no reduce ingresos; reportes conciliados explican cualquier diferencia.

### A13 — Media: filtros cambian solo partes del dashboard

**Evidencia:** en `Admin/Dashboard/AnalyticsService`, búsqueda/estado filtran pedidos e ingresos web; POS/costos aplican solo fechas. Ventas del mes son independientes del rango y la gráfica semanal usa siete días hasta endDate, ignorando inicio/búsqueda/estado.

**Corrección:** contrato explícito de filtros por bloque y etiquetas cuando una métrica sea global. **Aceptación:** pantalla/PDF/Excel mantienen el mismo alcance; un filtro por cliente no produce una utilidad mezclada con toda la tienda.

### A14 — Media: ingresos se presentan como rentabilidad y carritos como abandono

**Evidencia:** `app/Services/Analytics/AnalyticsService.php:210` llama profit a suma de precio por cantidad sin costo. `:297` considera abandonado un carrito solo cuando su usuario nunca tuvo un pedido, sin ventana temporal. Las categorías padre/hija pueden atribuir la misma venta varias veces.

**Corrección:** renombrar métricas actuales o calcular margen/abandono por sesión, período y conversión; declarar jerarquía de categorías. **Aceptación:** ejemplos conocidos de margen y abandono producen valores verificables.

### A15 — Media: devoluciones operativas no alimentan sus métricas

**Evidencia:** `Analytics/AnalyticsService.php:238` busca `devolucions`/`rma`; el módulo administrativo operativo trabaja con `rma_requests`. El numerador tampoco discrimina claramente solicitudes frente a devoluciones procesadas.

**Corrección:** usar el mismo origen operativo, cantidades y período; separar garantía/cambio/devolución. **Aceptación:** una devolución procesada actualiza la tasa y el valor correspondiente.

### A16 — Media: devolver por producto es demasiado grueso

**Evidencia:** `RmaRequest` contiene producto_id, no línea/variante/cantidad; `RmaProcessingService` procesa todos los items del producto. `InventoryService` excluye reposiciones posteriores por producto completo.

**Corrección:** detalles RMA por línea de pedido, variante, cantidad y condición física; ledger de cantidades restituidas. **Aceptación:** devolver una unidad de tres o una variante de varias repone exactamente lo recibido y permite solicitudes posteriores no solapadas.

### A17 — Alta: CRM vincula ventas/cancelaciones a la primera oportunidad abierta

**Evidencia:** `CheckoutService` y `UpdateOrderStatusService` seleccionan `CrmDeal` por usuario + open + first. No comprueban vínculo con el pedido.

**Impacto:** con varias oportunidades, una compra puede ganar la equivocada y una cancelación perder otra negociación. La venta puede sobrescribir el valor presupuestado.

**Corrección:** relación explícita pedido-oportunidad, creada al convertir cotización; eventos compartidos para cambios de estado. **Aceptación:** cancelar o pagar un pedido afecta únicamente su oportunidad y conserva el historial de oferta.

### A18 — Media: cotizaciones no seleccionan variante

**Evidencia:** `CrmPipelineService::addProduct` toma el precio mínimo de variantes activas y guarda producto, cantidad/precio. No identifica el SKU vendido; el cierre modifica `fecha_cierre_esperada` en lugar de conservar una fecha real separada.

**Corrección:** cotizar variante, precio acordado, impuestos, vigencia y versión; separar fecha prevista/real. **Aceptación:** una cotización de una variante cara no usa el precio de otra y puede convertirse en pedido sin ambigüedad.

## Integraciones, fiabilidad y operación

### A19 — Alta: campaña larga sin progreso persistente ni tiempo de reintento coherente

**Evidencia:** `SendMarketingCampaignJob.php` carga todos los usuarios y envía secuencialmente; timeout=3600. `config/queue.php` tiene retry_after=90 por defecto. Si el servidor usa ese valor y varios workers, un job aún activo puede recuperarse por otro worker. No existe registro por destinatario para reanudar sin duplicar.

**Corrección:** jobs pequeños por destinatario/lote, progreso y unicidad campaña-destinatario, límites del proveedor y timeout menor que retry_after. También registrar preferencias de recepción y baja cuando se use marketing real. **Aceptación:** caída/reintento a mitad de campaña no vuelve a enviar a quienes ya recibieron.

La relación timeout/retry_after está documentada por [Laravel](https://laravel.com/framework/docs/12.x/queues#job-expirations-and-timeouts). No se verificó la configuración del servidor real.

### A20 — Alta: automatizaciones permiten destinos HTTP sin protección SSRF

**Evidencia:** `CrmAutomationController` valida formato http/https; `AutomationEngineService.php:105` publica directamente a la URL proporcionada, con todo el modelo. No se bloquean red interna, loopback, metadatos cloud o redirecciones. Además, varias acciones carecen de registro idempotente; reintentar manualmente el job puede duplicar acciones anteriores.

**Corrección:** destinos permitidos, validación DNS/IP y redirects, control de salida de red, payload mínimo y ledger por evento/acción. **Aceptación:** destinos internos se rechazan sin realizar conexiones; reintento no recrea tareas/cupones ejecutados.

La protección propuesta sigue la guía primaria de [OWASP sobre SSRF](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html). No se realizó una explotación de red.

### A21 — Alta: webhook de WhatsApp acepta eventos sin firma si falta secreto

**Evidencia:** `WhatsAppWebhookController.php:59` solo verifica HMAC dentro de `if ($appSecret)`. Sin secreto, el endpoint público procesa y encola eventos. También registra el payload completo en debug.

**Corrección:** bloquear recepción no autenticada cuando el canal esté activo y mostrar configuración incompleta; minimizar logs. **Aceptación:** falta de secreto/firma inválida no encola eventos; firma válida se procesa una vez con deduplicación por ID del proveedor.

### A22 — Media: notificaciones y automatizaciones no son una entrega duradera

**Evidencia:** `UpdateOrderStatusService::sendNotifications` envía correo en la solicitud tras el commit y atrapa errores; si SMTP falla, no queda un trabajo de correo reintentable. `RunCrmAutomationJob` tiene un intento y serializa un modelo que puede cambiar antes de ejecutarse.

**Corrección:** outbox/evento persistente con snapshot, jobs por canal y estados de entrega. **Aceptación:** cambiar estado funciona aunque SMTP caiga; luego la notificación se reintenta sin reenviar efectos comerciales.

### A23 — Media: configuración puede quedar obsoleta en workers

**Evidencia:** `ConfiguracionSitio` conserva memo static de todos los valores. `establecer` lo limpia solo en el proceso actual; no invalida el memo de un worker que ya leyó los valores. Además se invalida el cache antes de escribir, abriendo una ventana para recachear datos antiguos.

**Corrección:** lectura con versión/TTL por proceso, invalidación después del commit y transacción para grupos de ajustes. **Aceptación:** un worker previamente iniciado observa un cambio de configuración mediante el mecanismo definido, sin depender de reinicios manuales no documentados.

### A24 — Media: secretos y comprobantes necesitan datos separados y snapshots

**Evidencia:** `SystemConfigurationService::getSettings` envía todas las claves/valores a React; secretos WhatsApp se guardan como texto con configuración general. `InvoiceGenerationService::downloadInvoicePdf` usa 18% fijo y datos actuales; POS une el cliente actual para regenerar comprobantes.

**Corrección:** campos públicos separados, secretos cifrados y campos de sustitución que no devuelvan el valor vigente. Guardar datos fiscales, tasa, importes y cliente al emitir; regenerar con el snapshot original. **Aceptación:** editar cliente/configuración no altera un comprobante histórico. Validar reglas tributarias reales con proveedor/asesoría antes de certificar cumplimiento; esta revisión no emite un dictamen legal.

## Rendimiento, interfaz y mantenibilidad

### A25 — Media: consultas masivas y polling continuo

**Evidencia:** compras descarga compras/productos/historial con get; pipeline descarga todos los deals y contactos; campaña carga todos los destinatarios. Dashboard hace múltiples sumas por día y whereDate/LOWER sobre columnas. Inbox consulta cada ocho segundos aun con Echo; notificaciones cada quince. El límite global es 60 solicitudes/minuto por usuario.

**Corrección:** paginación/búsqueda de selectores, agregados por rango temporal con índices comprobados mediante EXPLAIN, cache breve de métricas, polling adaptativo y pausa de pestañas ocultas. **Aceptación:** medir consultas, payload y p95 con datos representativos y varias pestañas; evitar 429 durante uso normal. No se midió capacidad máxima en esta revisión.

### A26 — Media: interfaz puede mostrar resultados obsoletos y fallos como cero

**Evidencia:** búsqueda de AdminLayout cancela el timer, no una petición ya iniciada; las respuestas pueden llegar fuera de orden. Analíticas sustituye errores por cero/arreglos vacíos sin distinguir estado de error. Drawer tiene Escape, pero falta semántica dialog, gestión de foco y nombre accesible del cierre. Compras aparece en dos grupos de navegación.

**Corrección:** AbortController/identificador de búsqueda, estados de carga/error/vacío, métricas no disponibles identificadas, modal accesible con restauración de foco, navegación sin duplicados. Mantener filtros al paginar y mensajes de validación que expliquen qué corregir. **Aceptación:** búsqueda rápida no muestra una consulta anterior; fallo de datos no parece una venta real de cero; flujo usable con teclado.

### A27 — Media: contratos duplicados y comprobaciones incompletas

**Evidencia:** existen servicios de inventario, facturación, RMA y analíticas paralelos, prototipos Domain y componentes sin uso. `DealDrawer/DealQuoteTab` piden JSON a una ruta que devuelve Inertia, pero no se encontraron importaciones desde pantallas activas: deuda latente, no fallo actual confirmado. README describe tecnologías/capacidades que no coinciden con composer, frontend y estructura actual. No se encontró `.github` ni una ejecución estática operativa.

**Corrección:** definir una implementación operativa por caso de uso, retirar código muerto/prototipos o aislarlo, documentar instalación/configuración reales y establecer CI con tests/build/análisis estático. Evitar una reescritura total sin necesidad.

**Aceptación:** instalación reproducible desde locks, migraciones desde cero en entorno desechable, pruebas de APIs/interfaces de exportación y suite MySQL para las garantías de bloqueo. Verificar especialmente stock/pagos simultáneos, autorización por recurso, reintentos y estados; los esquemas simplificados SQLite de pruebas actuales no acreditan esas garantías.

### A28 — Alta condicional: script público de despliegue en chatbot

**Evidencia:** `chatbot_novape/public/deploy.php` contiene una clave fija; la respuesta 403 revela la clave esperada. Cuando se autoriza, ejecuta shell e incluye `artisan key:generate --force`.

**Impacto si se publica:** un visitante puede desencadenar operaciones de despliegue y regenerar la clave de aplicación. No se comprobó que este archivo esté accesible en un servidor.

**Corrección:** retirar de la distribución pública y ejecutar despliegues por un canal autenticado de infraestructura. **Aceptación:** la URL no existe en despliegue y la clave estable de la aplicación no cambia por una solicitud web. El resto del chatbot requiere una auditoría independiente.

## Orden de implementación

1. **Contención de acceso y errores:** A01–A05, A20–A21 y A28 si está publicado. Añadir pruebas que fallen ante los comportamientos inseguros.
2. **Integridad comercial:** A06–A10, A16–A18. Estados separados, ledger de inventario/beneficios, caja física y operaciones idempotentes.
3. **Datos fiables e integraciones:** A11–A15, A19, A22–A24. Contrato común de métricas, costos/snapshots y entrega duradera.
4. **Escala y experiencia:** A25–A27. Paginación, medición, accesibilidad, documentación y automatización de comprobaciones.

Antes de considerar cerrado un bloque, probar sus criterios de aceptación y conciliar pedido ↔ pago ↔ movimiento de inventario ↔ comprobante ↔ oportunidad CRM. Para operación real faltan evidencia de restauración de backups, observabilidad de workers/scheduler, conciliación de proveedores y una revisión visual de los flujos por rol y dispositivo. Son verificaciones pendientes, no fallos de infraestructura confirmados.
