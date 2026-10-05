# Segunda revisión de código y funcionalidad

Fecha: 4 de octubre de 2026. Continúa la auditoría del panel administrativo y comprueba también los servicios relacionados con pedidos, notificaciones y envíos. Las imágenes de productos y el submódulo `chatbot_novape` permanecen fuera del trabajo.

## Correcciones adicionales

| Problema comprobado | Cambio aplicado |
| --- | --- |
| `CrmEvidenceLedger` y `Devolucion` usaban un trait sin importar, provocando errores fatales al cargar las clases | Imports corregidos; prueba que carga todos los modelos de la aplicación |
| `CajaMovimiento` apuntaba a una clase inexistente | Modelo `CajaSesion` con tabla, relaciones y casts correspondientes |
| Policies usaban `App\Models\User`, `hasRole` y `hasPermissionTo`, inexistentes en este proyecto | Modelo `Usuario`, permisos reales y bloqueo por estado; proveedor de autorización registrado |
| Un propietario podía quedar autorizado para actualizar estados de un pedido en la policy heredada | La actualización requiere permiso de edición; la lectura conserva el acceso al propietario |
| Búsqueda de productos llamaba Scout sin tenerlo configurado y declaraba un tipo de retorno incorrecto | Consulta SQL paginada por nombre/SKU, excluyendo productos inactivos y limitando el tamaño de página |
| El formulario permitía crear oportunidades sin contacto, pero la columna era obligatoria | Migración que permite `usuario_id` nulo, aplicada localmente sin borrar registros |
| Scope de atributos CRM llamaba un método inexistente | Uso del scope del paquete instalado; pruebas con filtros JSON |
| Cotizaciones y campos personalizados podían recalcularse o sobrescribirse con datos obsoletos | Recarga de la oportunidad bajo bloqueo antes de modificar productos o atributos; rechazo de cantidades no positivas |
| Completar tareas convertía cualquier texto no vacío, incluido `"false"`, en verdadero | Validación booleana explícita |
| Dos formularios de campos personalizados tenían capacidades diferentes y errores SQL ante duplicados | Validación compartida, soporte de empresa/select/opciones/obligatoriedad y error de duplicado por campo |
| Automatizaciones aceptaban acciones incompletas y eventos desconocidos | Validación de eventos, acciones, operadores, URL y mensajes antes de guardar |
| Una condición malformada podía habilitar una automatización | Condiciones inválidas fallan; `contains` verifica ambos tipos |
| Automatizaciones buscaban `company` en oportunidades que realmente usan `cliente`/`empresa` | Resolución del destinatario con las relaciones reales y fallo explícito si no hay correo válido |
| Webhooks HTTP 500 se registraban como acciones ejecutadas | Los errores del proveedor se propagan al job para quedar visibles como fallo |
| Automatizaciones asignaban tareas al usuario fijo 1 | Autor tomado del contexto del evento y comprobado como trabajador activo |
| La acción «crear tarea» no hacía nada para empresas | Soporte de tareas vinculadas a empresa, migración, listado, edición, enlace y calendario |
| El correo de confirmación intentaba emitir otra factura y llamaba una función PDF no instalada | Emisión separada del envío; PDF mediante el servicio DomPDF existente |
| Fallos del correo se ocultaban y el job terminaba como exitoso | Excepción propagada y reintentos con espera |
| La emisión consultaba un pedido obsoleto y podía competir con otro worker | Bloqueo compartido por pedido, recarga y reconocimiento de comprobantes ya emitidos; rechazo de pedidos pendientes |
| El job fiscal rechazaba estados pagados con distinta capitalización o avanzados | Comprobación normalizada de estados pagados; omisión de emisiones ya realizadas |
| Reembolsos leían relaciones obsoletas y podían volver a marcar pagos reembolsados como pendientes | Pedido, pago y transacción recargados bajo bloqueo; confirmación repetida sin segunda cancelación |
| Protección del último administrador sin exclusión entre operaciones | Transacciones y bloqueo compartido del rol administrador antes de bloquear, borrar o quitar el rol |
| Exportaciones retenían todas las filas o todo el CSV en memoria | Descarga por streaming con consultas por bloques para productos, clientes, trabajadores y pedidos |
| Servicios externos leían `env()` directamente y podían perder configuración con `config:cache` | Configuración central para Gemini, OpenWA, FedEx y Shippo; ya no hay llamadas a `env()` en `app` |
| Shippo desviaba los tokens reales al simulador | Los tokens configurados pueden consultar el proveedor; la ausencia de token conserva la estimación local existente |
| Investigación CRM generaba valores, fuentes y confianza aleatorios | Eliminación de simulaciones; adaptador HTTP configurable que conserva solo evidencia de campos conocidos y requiere revisión humana |
| Investigación automática podía ejecutarse antes del commit o fallar al crear empresa sin proveedor | Encolado después del commit y únicamente si el proveedor está configurado |
| Seguimiento exponía el pedido de otro cliente mediante su código | Comprobación de propiedad/administrador antes de consultar tracking o devolver datos |
| Peso de envío tomado de una columna inexistente del producto | Peso de la variante correspondiente, con valor de respaldo cuando no está registrado |
| Script de auditoría consultaba una tabla mal nombrada y podía dejar resultados anteriores | Tabla `proveedor` corregida, ejecución real de los streams y código de salida de fallo |

## Resultado de las comprobaciones

- **76 pruebas aprobadas y 267 comprobaciones** en la suite completa.
- **75 consultas revisadas:** 74 HTTP 200 y una redirección HTTP 302 prevista de proveedor a edición; ningún error HTTP 400/500.
- Se ejecutaron los siete streams CSV y se comprobaron sus respuestas, además de PDF/Excel.
- **23 pantallas** verificadas en Chrome: renderizadas, sin errores JavaScript ni fallos detectados en scripts/estilos.
- Dashboard móvil sin desbordamiento horizontal detectado.
- Compilación de producción correcta y comprobación de espacios/diffs sin errores.
- Los servicios externos se probaron con respuestas simuladas controladas. Los correos de pruebas utilizaron fakes o transporte en memoria. **No se enviaron mensajes, campañas, cobros, reembolsos ni documentos fiscales reales.**

PHPStan/Larastan registra **263 incidencias**, frente a las 370 del análisis anterior. El detalle está en `storage/logs/admin-second-static.json`. Incluye tipos, modelos dinámicos y prototipos heredados; no equivale a 263 fallos de ejecución confirmados. No se ocultaron incidencias con un baseline ni comentarios para ignorarlas. El análisis estático todavía no pasa y una suite aprobada no certifica cada flujo posible.

## Migraciones incluidas y aplicadas localmente

1. `2026_10_04_220000_allow_crm_deals_without_contact.php`.
2. `2026_10_04_221000_support_company_crm_tasks.php`.

En la otra PC o servidor deben ejecutarse ambas migraciones antes de usar estas funciones. Su reversión rechaza la operación si existen oportunidades/tareas sin contacto u oportunidad, para evitar eliminar datos o inventar asociaciones.

## Proveedor de investigación CRM

Es opcional. Se configura mediante `CRM_ENRICHMENT_URL` y `CRM_ENRICHMENT_TOKEN`. El adaptador envía un POST con `model_type`, `model_id`, `context` y `fields`. El proveedor debe responder:

```json
{
  "evidence": [
    {
      "field_name": "sector_empresa",
      "value": "Retail",
      "source": "https://proveedor.example/evidencia",
      "confidence": 80
    }
  ]
}
```

El valor y la fuente deben proceder del proveedor real. La aplicación valida el formato y el campo conocido, guarda la sugerencia como `pending` y no la aplica automáticamente. Sin configuración, la creación de empresas continúa funcionando y no se genera investigación ficticia.

## Límites que siguen pendientes

La aceptación fiscal real y emisión POS, entrega SMTP/WhatsApp, supervisión de workers/scheduler y reembolsos reales requieren configuración e integración con los proveedores. El bloqueo fiscal evita trabajadores simultáneos, pero un timeout después de que el proveedor acepte requiere reconciliación e idempotencia soportada por el proveedor; no se ha certificado emisión exactamente una vez.

Las cotizaciones de transporte aún conservan estimaciones locales de respaldo y datos simplificados. Falta validar direcciones reales, dimensiones, moneda y tarifas con los proveedores antes de considerar esos importes una cotización confirmada del transportista.

Quedan por completar la reanudación persistente de campañas por destinatario, métricas de conversión/ROI, costos históricos para márgenes contables, pruebas de carga y concurrencia simultánea en MySQL, monitoreo y restauración de backups. Los prototipos Domain/API no publicados también conservan referencias incompletas y deben corregirse o retirarse antes de habilitarlos.

## Repetir las verificaciones

```powershell
php artisan test
npm.cmd run build
php scripts/audit_admin_pages.php
php scripts/admin_audit_session.php
node scripts/audit-admin-browser.mjs
php vendor/bin/phpstan analyse --memory-limit=1G --error-format=json --no-progress
```

Los resultados y logs permanecen fuera de Git. El script de navegador elimina su sesión temporal al terminar; si se interrumpe, ejecutar `php scripts/admin_audit_session.php cleanup`.
