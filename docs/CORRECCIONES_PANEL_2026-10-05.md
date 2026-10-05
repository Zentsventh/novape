# Correcciones del panel — 5 de octubre de 2026

Este documento complementa la auditoría inicial: sus hallazgos describen el estado anterior a las correcciones. Se modificaron backend, frontend, esquema, dependencias y pruebas, conservando los cambios del usuario que ya existían en el repositorio.

## Cambios aplicados

| Área | Resultado |
| --- | --- |
| Permisos y auditoría | Administrar privilegios exige administrador; se bloquea la escalada por asignación de roles. Se identifica al actor administrativo y se excluyen credenciales, incluso al presentar auditorías antiguas. |
| Inbox y WhatsApp | Autorización compartida sobre conversaciones; canales privados por asesor y supervisores. Agentes activos y autorizados, webhook firmado, TLS verificado y procesamiento serializado por remitente para evitar contactos y mensajes duplicados. |
| Pedidos e inventario | Transiciones válidas bajo bloqueo, avance solo con pago, cancelación sin devolución de stock no consumido. Se respetan reservas en POS, ajustes y transferencias. |
| Caja y POS | Caja física y almacén persistidos, sin respaldo silencioso. Clave de operación única permite recuperar la misma venta incluso después de cerrar caja. Descuentos requieren permiso. Precio, nombre, SKU y costo proceden del servidor. |
| Devoluciones | Cantidades por línea, recepción parcial y condición vendible/no vendible. Ledger compartido con cancelación evita devolver más unidades que las vendidas o reponer dos veces. |
| Checkout y cobros | Reservas de puntos/cupones bajo bloqueo y límites revalidados. Conciliación durable de Niubiz antes de autorizar; callbacks repetidos no vuelven a cobrar. Se rechazan pedidos cancelados, importes alterados y reservas vencidas antes de contactar la pasarela. |
| Facturación | Empresa, cliente, precios e IGV conservados al vender. Exportación Excel compatible. Las líneas fiscales concilian descuentos, envío y total; no se simula aceptación del proveedor. |
| CRM | Cotizaciones por variante con precio y SKU correctos; búsquedas y recargas corregidas. Cierre real separado del esperado; solo se actualiza la oportunidad vinculada expresamente al pedido. Búsqueda y paginación del pipeline en servidor. |
| Marketing y automatizaciones | Entregas individuales persistidas, protección frente a reenvíos y reportes por campaña. Automatizaciones con snapshot y ledger; webhooks HTTPS públicos, DNS validado y fijado, sin redirecciones a redes privadas. |
| Notificaciones y configuración | Outbox transaccional de pedidos, recuperación de pendientes y resultados persistidos. Secretos cifrados, sin exposición a la interfaz y lectura coherente tras cambios. |
| Métricas y compras | Estados de ingresos normalizados, devoluciones reales, abandono con criterio temporal y errores visibles. Compras paginadas, agregados del filtro completo y categorías sin duplicar ingresos. |
| Interfaz y mantenimiento | Búsquedas cancelables, polling reducido, foco y Escape en drawers, errores visibles, navegación y fuentes corregidas. Assets locales sin CDN fijo. Eliminados prototipos sin rutas activas y cerrada la superficie pública de despliegue del chatbot. |
| Dependencias y CI | Composer y Excel alineados con PHP 8.3–8.5; relaciones tipadas para Larastan. Workflow con pruebas, análisis estático y compilación. |

## Base de datos

Las migraciones se aplicaron en MySQL local después del respaldo `storage/app/private/panel-backup-20261005-010628.sql`. Se corrigieron tipos signed/unsigned de claves foráneas y se hizo reanudable la migración principal ante DDL parcialmente aplicado. El respaldo contiene información privada y no debe publicarse.

El backfill marca consumo de inventario únicamente cuando existe evidencia de pago exitoso. Para devoluciones históricas procesadas registra protección contra reposición repetida, sin volver a modificar inventario. Los costos y datos fiscales históricos no guardados al vender no pueden reconstruirse con certeza desde el catálogo actual.

## Verificación y límites

Resultados verificados:

| Comprobación | Resultado |
| --- | --- |
| Suite PHPUnit | 101 pruebas aprobadas, 333 assertions; SQLite en memoria y migraciones desde cero. |
| PHPStan/Larastan | Cero errores. |
| Frontend | Compilación de producción correcta, assets y fuentes locales. |
| Composer | Validación estricta y requisitos de plataforma correctos en PHP 8.5.10. |
| Rutas de lectura | 74 respuestas HTTP 200 y una redirección 302 prevista; incluye exportaciones. |
| Navegador | 23 pantallas principales con HTTP 200, renderizado correcto y sin errores JavaScript ni fallos de scripts/estilos. |
| Base local | Migraciones aplicadas; respaldo previo conservado. |

Las pruebas usan base aislada y sustitutos de correo/HTTP; rutas y navegador se verifican localmente sin enviar operaciones comerciales reales. La matriz PHP 8.3/8.5 queda configurada en CI; no se presenta como una ejecución remota ya realizada.

Para operación completa deben permanecer activos el worker, scheduler y Reverb, y configurarse las credenciales externas. No se ejecutaron cobros ni reembolsos reales, emisiones fiscales reales, campañas a clientes ni entregas reales de Meta/SMTP. La validación local no certifica disponibilidad de proveedores ni equivale a carga o concurrencia multinodo en producción.

Las operaciones con resultado externo incierto requieren conciliación: revisar `payment_reconciliations`, `order_notification_outbox`, `marketing_deliveries` y `automation_executions` antes de reenviar. La vista del pedido muestra cobros pendientes de revisión y el informe de campaña muestra las entregas.

Quedan como mejoras de escala: búsqueda remota de todos los selectores de catálogo/contactos, pruebas de carga y métricas de workers. No se auditó íntegramente el subproyecto chatbot; se corrigió su superficie pública de despliegue identificada y la verificación TLS del cliente utilizado por la aplicación.
