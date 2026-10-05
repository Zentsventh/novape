# Comunicación del panel y Omnicanal CRM

Se implementaron tres espacios con responsabilidades distintas:

| Espacio | Usuarios | Datos y función |
| --- | --- | --- |
| Chatbot de tienda | Visitantes y clientes | Atención comercial y conversaciones de clientes existentes |
| Equipo (`/admin/equipo`) | Trabajadores activos | Chat directo y grupos privados, historial, no leídos y confirmaciones de lectura |
| Asistente del panel (`/admin/asistente`) | Trabajadores activos | Historial privado, resumen operativo, contexto autorizado de conversaciones y borradores |

## Uso

Equipo está disponible desde los menús del panel y CRM. «Nueva conversación» permite buscar trabajadores activos. Un destinatario abre un chat directo; varios destinatarios crean un grupo con nombre opcional. El historial carga 50 mensajes por página. Los chats directos existentes se reutilizan. Los clientes y trabajadores inactivos no se pueden incorporar.

El asistente se abre desde el botón flotante del panel o su página. «Resumen operativo» obtiene cantidades actuales de bandeja, oportunidades, casos y seguimientos, según los permisos del trabajador. En la cabecera de una conversación de Omnicanal CRM, «Asistente» permite resumir sus últimos 20 mensajes públicos y preparar una respuesta. «Usar como borrador» copia el texto al editor de esa misma conversación. El asesor revisa y pulsa Enviar con los controles normales de la bandeja.

## Separación y permisos

- Los mensajes de trabajadores usan `staff_threads`, `staff_thread_members` y `staff_messages`; nunca ingresan en las tablas de clientes ni en los transportes WhatsApp/Messenger/Instagram.
- Cada lectura, envío y confirmación de lectura requiere pertenecer al chat, además del guard `admin` y trabajador activo.
- Los eventos Reverb se publican en canales privados por trabajador, `novape-team.user.{id}`. El evento contiene el identificador del chat; los mensajes se vuelven a consultar con autorización. Hay actualización periódica como respaldo si Reverb falla.
- El historial del asistente usa `panel_assistant_sessions` y `panel_assistant_messages`, y solo lo puede consultar su propietario.
- El contexto de bandeja respeta `gestionar_omnichannel` y la asignación al asesor; los supervisores conservan la visibilidad definida por el sistema existente. Las métricas CRM requieren `crm.gestionar`.
- El historial enviado al proveedor queda limitado al mismo contexto y conjunto de permisos. No se envían credenciales, campos de autenticación, teléfonos del contacto ni notas internas como contexto automático.
- Los textos recibidos se muestran como texto de React. El asistente no ejecuta herramientas, SQL, comandos ni envíos a clientes.
- Los reintentos conservan un UUID y no duplican mensajes. El asistente usa un bloqueo por trabajador y petición para resolver reintentos concurrentes.
- Los límites de solicitudes de Equipo, asistente y envío de bandeja tienen claves independientes del límite general del panel.

## IA y recuperación

La integración usa [Gemini generateContent](https://ai.google.dev/api/generate-content), con instrucciones y servicio propios del panel. Puede reutilizar las credenciales existentes sin compartir el historial ni el flujo del bot de tienda.

Variables opcionales:

```dotenv
PANEL_ASSISTANT_GEMINI_API_KEY=credencial_del_panel
PANEL_ASSISTANT_GEMINI_API_KEY_SECONDARY=credencial_de_respaldo
PANEL_ASSISTANT_GEMINI_MODEL=gemini-3.8-flash
```

Si se omiten las variables de claves, se usan `GEMINI_API_KEY` y `GEMINI_API_KEY_SECONDARY`. Una clave principal del panel explícitamente vacía activa únicamente el modo local. Después de cambiar configuración: `php artisan config:clear`.

Cada credencial tiene un límite de conexión de 3 segundos y de petición de 10 segundos. Si falla la principal se prueba la secundaria; se prefiere durante una hora la última que respondió correctamente, almacenando solo su huella. Si ambas fallan, el asistente entrega un resumen local o un borrador base e indica el modo de respuesta. El proveedor mostró disponibilidad intermitente durante la validación local; no se eliminó la verificación TLS ni se ocultó el uso del respaldo.

## Operación y verificación

Migraciones aplicadas:

- `2026_10_05_140000_create_panel_communication`
- `2026_10_05_150000_add_panel_assistant_context`

Para tiempo real: Reverb y la conexión de broadcast correspondientes; para cola asíncrona en producción, mantener un worker de Laravel. El entorno local existente usa cola `sync`. Si falla el broadcast, los mensajes comprometidos siguen disponibles por consulta periódica.

Comandos de validación:

```text
php artisan test --compact
php vendor/bin/phpstan analyse --memory-limit=1G --no-progress
npm run build
node scripts/check-panel-communication.mjs
php scripts/check-panel-provider.php
```

Las pruebas funcionales comprueban guard y estado activo, exclusión de clientes, pertenencia a chats, aislamiento de historiales, paginación, no leídos, idempotencia, permisos del contexto, separación de límites y recuperación del proveedor. La suite completa pasó con 122 pruebas y 477 aserciones; las 10 pruebas específicas de comunicación también pasaron después de los ajustes finales del servidor, y PHPStan terminó sin errores. La compilación de Vite pasó.

La prueba de navegador crea únicamente trabajadores y una conversación temporales de QA, revisa Reverb, chat directo/grupo, copia del borrador sin enviar a cliente y pantallas de 390/1440 px, y elimina sus datos al finalizar. Su informe y capturas se guardan en `storage/logs/panel-communication-browser.json` y `panel-*.png`. El recorrido final terminó sin errores de JavaScript y confirmó que el borrador no agregó mensajes al cliente. La inspección visual corrigió el menú lateral del CRM para que, en móvil, se abra como una capa superpuesta y deje todo el ancho útil al contenido. El diagnóstico del proveedor muestra códigos y estado sin imprimir claves.

También se corrigió el nombre del comando programado para limpiar reservas expiradas, que apuntaba a un comando inexistente, y se precisó el tipo de la relación de listas necesario para el análisis estático. No se realizaron conversiones de imágenes para esta implementación.
