# Auditoría y correcciones del panel administrativo

Fecha: 4 de octubre de 2026. Proyecto: Novape. Entorno revisado: Windows, PHP 8.3, Laravel 12, React/Inertia, MySQL local.

**Actualización:** la [segunda revisión](AUDITORIA_SEGUNDA_REVISION_2026-10-04.md) corrige pendientes adicionales y contiene las cifras de validación actuales. Los apartados siguientes documentan el estado de la primera revisión.

## Resultado y alcance

Se revisaron rutas, permisos, servicios de negocio, validaciones, consultas, reportes, trabajos en cola y pantallas del panel. Se corrigieron fallos reproducibles y se añadieron pruebas de regresión. Las imágenes de productos quedan fuera del alcance, según lo solicitado. No se modificó el submódulo `chatbot_novape`.

El panel supera las comprobaciones locales descritas abajo. Esto **no certifica el 100 % de todos los flujos ni la preparación completa para producción**: siguen pendientes la configuración y validación de servicios externos, varias funciones de negocio y deuda técnica identificada. Una página que responde HTTP 200 no demuestra por sí sola que todas sus operaciones funcionen.

## Hallazgos corregidos

| Área | Error encontrado | Corrección aplicada |
| --- | --- | --- |
| Arranque | Conexión MySQL local con opciones SSL incompatibles; frontend sin compilación disponible | Configuración SSL explícita y compilación de los recursos del frontend |
| Inertia | El registro de devtools agotaba memoria al abrir páginas con respuestas grandes, produciendo 500 | Devtools desactivado por defecto; activación explícita mediante configuración |
| Vite | El proveedor eliminaba `public/hot` al iniciar Artisan, rompiendo la selección de recursos | Eliminación de ese efecto secundario |
| Sesiones | Un trabajador bloqueado podía conservar acceso administrativo con una sesión existente | Comprobación de estado activo en cada petición; invalidación de sesiones al bloquear, eliminar o restablecer contraseña |
| Roles | Un operador podía asignar o modificar administradores; se podía dejar el sistema sin administrador activo | Restricción de operaciones sobre administradores y protección del último administrador activo |
| Roles base | Renombrar roles estructurales rompía la lógica de acceso; eliminar roles usados dejaba relaciones inconsistentes | Protección de nombres base y de roles asignados |
| Contraseñas | Restablecimiento e importación usaban contraseñas compartidas y predecibles | Generación aleatoria por usuario |
| Permisos | El frontend conservaba permisos obsoletos durante una hora | Permisos actuales en cada respuesta Inertia |
| Navegación | Enlaces con permisos distintos a sus rutas; módulos disponibles sin acceso desde el menú | Corrección de permisos y enlaces para clientes, CRM, categorías, marcas, campañas y métodos de pago |
| Buscador | El menú consultaba una URL inexistente | Uso de `/admin/buscar`, validación de entrada y manejo de errores |
| Logout | Cierre administrativo mediante GET y exclusión de protección CSRF | Cierre administrativo exclusivamente mediante POST protegido |
| Notificaciones | Se podían marcar notificaciones ajenas como leídas | Consulta limitada al usuario autenticado |
| Tiempo real | Canal de inbox insuficientemente restringido y host local problemático | Autorización de personal activo con permiso omnichannel; conexión local a Reverb por IPv4 |
| POS | `clone` aplicado a una cantidad numérica producía error fatal al vender | Eliminación de la operación inválida |
| POS | Precios y nombres enviados por el navegador podían determinar la venta | Valores calculados a partir de productos y variantes de la base de datos |
| POS | Líneas duplicadas, descuentos inválidos y métodos de pago inactivos | Rechazo de datos inconsistentes; validación de pagos y descuentos |
| POS | Subtotal y cálculo de identificación del cliente no coincidían con el total real | Base imponible e IGV consistentes; controles sobre el total calculado por el servidor |
| POS | Stock global confundido con stock del almacén; reservas web ignoradas | Existencia local y descuento de reservas vigentes en el almacén ecommerce |
| Caja | Apertura y movimientos podían competir con cierre o ventas | Transacciones y bloqueos de filas; efectivo mostrado consistente con el cierre |
| Inventario | Transferencias al mismo almacén y ajustes que dejaban cantidades negativas | Validaciones y bloqueo de variante antes de modificar existencias |
| Almacenes | Eliminar un almacén podía borrar su historial de movimientos | Rechazo de eliminación con historial |
| Compras | Repetir recepción podía incrementar stock dos veces; variantes de otro producto; códigos basados en conteo | Revalidación bajo bloqueo, asociación producto/variante y códigos únicos |
| Devoluciones | Cambios libres de estado y procesamiento repetido podían duplicar stock | Servicio transaccional RMA, transiciones permitidas y protección frente a devoluciones superpuestas |
| Cancelaciones | Cancelar después de devolver productos podía reponerlos nuevamente | Exclusión de unidades ya repuestas mediante RMA; pedido recargado bajo bloqueo |
| Dashboard | Filtros de pedidos aplicados a consultas POS/gastos causaban errores SQL | Separación de filtros de fecha y filtros propios de pedidos |
| Reportes | PDF/Excel trataban arrays como objetos; ventas POS fuera del periodo y columnas incorrectas | Plantillas compatibles y cifras del periodo; validación de filtros |
| Indicadores | Porcentajes de crecimiento fijos y una cifra denominada ganancia neta sin cálculo contable suficiente | Eliminación de porcentajes ficticios; etiqueta «saldo operativo» |
| Ranking | Variantes limitadas antes de agrupar y productos distintos unidos por nombre | Agrupación por ID de producto antes de limitar, con una sola consulta |
| Login | Roles especializados redirigidos a dashboard sin permiso | Selección de un módulo permitido; error explícito si no hay módulos asignados |
| CRM | Búsqueda de columna inexistente; relación de producto ausente; cotizaciones con precio cero | Consultas y relación corregidas; precio de variante activa |
| CRM | Evidencia y campos personalizados permitían aplicar datos sin comprobar el origen | Validación del registro, campo y valor de evidencia almacenada; soporte de empresa |
| Automatizaciones | Efectos secundarios dentro de operaciones principales y campo incorrecto al crear cupones | Trabajo en cola después del commit y corrección del campo del cupón |
| Marketing | Audiencia incorrecta, doble lanzamiento y fallos de envío ocultados | Audiencia activa, transición atómica de campaña y estado de fallo explícito |
| Marketing | Campañas podían declararse enviadas usando mailer de pruebas; ROI sin medición | Bloqueo de mailers `log/array` para campañas y ROI sin valor inventado |
| Comprobantes | Simulación marcaba aceptación SUNAT con enlaces ficticios | Eliminación del éxito simulado; fallo explícito sin proveedor configurado |
| Comprobantes | URL pública adivinable y PDFs en almacenamiento público | Enlaces firmados y almacenamiento privado de PDFs/QR POS; traslado local conservando los archivos |
| Comprobantes | Trabajadores podían descargar comprobantes POS de otros cajeros | Acceso limitado al cajero de la venta o administrador |
| Comprobantes | PDFs internos afirmaban ser electrónicos y usaban RUC de ejemplo | Identificación como registro interno y datos de empresa desde configuración |
| DNI/RUC | Fallos del proveedor devolvían «USUARIO DE PRUEBA» como resultado exitoso | Fallo explícito y entrada manual; límites de tiempo y validación del documento |
| API de inventario | Prototipo sin autenticación, controlador inexistente y estructura UUID ajena al inventario operativo | Retiro de las rutas no utilizadas; se mantiene el inventario protegido del panel |
| Rutas | Acciones resource ausentes en proveedores y cupones | Implementación de páginas/redirecciones correspondientes |
| Formularios | Actualización parcial de banner descartaba el campo activo; descuentos porcentuales superiores a 100 | Validaciones corregidas |
| CSV | Comillas/saltos de línea mal escapados y posibilidad de fórmulas al abrir hojas de cálculo | Codificación CSV común y neutralización de fórmulas en texto recibido |
| Importación | CSV vacío o mapeo inexistente podía producir 500; filas sin validación suficiente | Rechazo controlado antes de escribir y validación por fila |
| Configuración | Cambios de ajustes no invalidaban todos los cachés utilizados | Invalidación conjunta de valores y configuración global |
| Pruebas | La suite Unit no se ejecutaba; pruebas antiguas usaban una factory ausente y suponían borrado físico | Activación de Unit y actualización de fixtures y expectativa de borrado lógico |

## Validación realizada

- Compilación de producción con `npm.cmd run build`: correcta.
- Suite automatizada: **52 pruebas aprobadas y 130 comprobaciones** con `php artisan test`. El resultado final se registra en `storage/logs/admin-tests.log`.
- Auditoría de consultas sobre la base local: **64 respuestas HTTP 200**, incluyendo páginas de detalle disponibles y exportaciones PDF/Excel.
- Navegador Chrome: **23 pantallas con HTTP 200**, contenido renderizado, sin errores JavaScript ni cargas fallidas de scripts/estilos detectadas.
- Dashboard móvil a 390 px: sin desbordamiento horizontal detectado.
- Pruebas de reglas de negocio con SQLite: importes calculados desde base de datos, rollback por pagos incorrectos, reservas, recepción única, RMA, cancelación posterior a devolución, transferencias y permisos.
- PHPStan/Larastan nivel 5: **370 incidencias en la ejecución registrada**. Incluye problemas de tipos, modelos dinámicos, servicios heredados y usos de `env()` fuera de configuración; no equivale a 370 fallos comprobados de ejecución. El análisis estático todavía no pasa.

Las pruebas de negocio no crean ventas, compras ni ajustes en la base real. La sesión temporal del navegador se elimina al finalizar. No se enviaron campañas ni se ejecutaron cobros, reembolsos o emisiones externas. Los logs y resultados de auditoría están excluidos de Git.

Ejemplos concretos de deuda detectada por el análisis estático: `app/Domain/Dashboard/Controllers/DashboardController.php` referencia un servicio ausente; los prototipos de inventario referencian eventos `StockUpdated`/`WarehouseUpdated` y un `WarehouseResource` ausentes; `CajaMovimiento` referencia `CajaSesion`, que no existe; algunas policies presuponen `App/Models/User` en vez del modelo real `Usuario`. Estos componentes necesitan revisión antes de habilitar rutas o funcionalidades que dependan de ellos. La auditoría local de pantallas no sustituye esa corrección.

## Pendientes reales para completar el producto

| Prioridad | Pendiente | Criterio para darlo por terminado |
| --- | --- | --- |
| Alta | Facturación electrónica real | Configurar proveedor, series y datos de empresa; verificar contrato/payload, descuentos, respuesta de aceptación, XML/PDF/CDR y recuperación ante errores en sandbox; proteger emisiones concurrentes y reintentos con idempotencia persistente |
| Alta | Emisión electrónica POS | El ticket POS es un registro interno. Falta integrar su emisión y consulta de aceptación con el proveedor, sin asumir aceptación al generar el PDF |
| Alta | Correo y colas | El entorno usa `MAIL_MAILER=log` y cola en base de datos. Configurar SMTP/proveedor, worker supervisado y scheduler; probar entrega, errores y recuperación. No se arrancó el worker para evitar ejecutar mensajes pendientes |
| Alta | Reembolsos Niubiz | Actualmente dependen de anulación manual y confirmación del operador. Falta integrar y reconciliar el reembolso con la pasarela; validar carreras entre devolución, cancelación y reembolso |
| Alta | Datos fiscales | Establecer `INVOICE_COMPANY_NAME`, `INVOICE_COMPANY_RUC`, `INVOICE_COMPANY_ADDRESS`, `INVOICE_COMPANY_PHONE`, `INVOICE_COMPANY_EMAIL` y, si procede, `INVOICE_COMPANY_HOURS`; no se inventaron datos del negocio |
| Media | Campañas robustas | Falta registro persistente por destinatario, deduplicación/reanudación y medición real de aperturas, clics y conversiones. No se dispone de datos suficientes para calcular ROI |
| Media | Contabilidad y márgenes | El saldo operativo actual resta compras recibidas y gastos a ventas; falta costo histórico por unidad vendida, asignación de descuentos, devoluciones y margen por producto |
| Media | Pruebas de concurrencia real | Los bloqueos añadidos requieren pruebas simultáneas sobre MySQL para caja, reservas, transferencias, último administrador y devoluciones. SQLite no reproduce todos los bloqueos ni interbloqueos de MySQL |
| Media | Escalabilidad | Exportaciones de clientes/productos cargan colecciones completas y el CSV de pedidos acumula un string. Falta streaming general, pruebas con volúmenes grandes y revisión de índices/consultas del dashboard |
| Media | Servicios heredados | Queda un servicio Greenter sin uso con certificado/credenciales de prueba y un `ProductService::search` heredado que presupone Scout. Deben retirarse o implementarse antes de conectarlos a nuevas rutas |
| Media | Análisis estático | Resolver las incidencias restantes sin ocultarlas con un baseline indiscriminado; añadir contratos/tipos correctos y corregir los fallos reales que se reproduzcan |
| Media | Operación de producción | Configurar HTTPS y secretos fuera del repositorio, copias de seguridad con restauración comprobada, monitoreo de fallos/colas, supervisión de Reverb y pruebas de carga |

Los comprobantes existentes trasladados conservan su contenido anterior. Para obtener QR firmados y las nuevas etiquetas deben regenerarse desde la venta correspondiente. Los QR antiguos sin firma dejarán de abrir la ruta protegida. En otra PC o servidor también deben trasladarse los archivos de `storage/app/public/facturas` y `storage/app/public/qrs` a sus equivalentes privados antes de publicar la actualización.

## Reproducción

```powershell
php artisan test
npm.cmd run build
php scripts/audit_admin_pages.php
php scripts/admin_audit_session.php
node scripts/audit-admin-browser.mjs
php vendor/bin/phpstan analyse --memory-limit=1G --error-format=json --no-progress
```

La auditoría de navegador requiere el servidor local en `127.0.0.1:8000`, Chrome instalado en la ruta indicada por el script y sesión en base de datos. Si se interrumpe, ejecutar `php scripts/admin_audit_session.php cleanup`. No publicar los scripts de auditoría como endpoints HTTP.
