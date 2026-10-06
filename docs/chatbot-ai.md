# Chatbot con IA

El panel `/admin/chatbot/conocimiento` permite guardar textos y documentos PDF con texto, DOCX, TXT y Markdown (5 MB / 200.000 caracteres), revisar el contenido, activarlo, editarlo y eliminarlo. Los PDF escaneados deben pasar por OCR antes de cargarse. El contenido se usa mediante recuperación de conocimiento (RAG); no se modifican los pesos del modelo.

## Puesta en marcha

1. Ejecuta `php artisan migrate` y `npm run build`.
2. Configura `GEMINI_API_KEY` en `.env`. Opcionalmente configura `GEMINI_API_KEY_SECONDARY` como respaldo. Nunca se envían claves al navegador.
3. Ejecuta `php artisan config:clear` después de cambiar el entorno.
4. La indexación utiliza una conexión de base de datos dedicada con reintentos y un tiempo de reserva de 1020 segundos. Ejecuta un trabajador supervisado: `php artisan queue:work chatbot --queue=chatbot --timeout=960 --tries=3`. Las tablas de cola deben existir.
5. Abre el panel con un usuario que tenga `gestionar_ajustes`, añade documentos como borrador, revisa el texto y activa las fuentes aprobadas.
6. Activa la búsqueda por significado en la configuración y pulsa «Indexar por significado» en las fuentes existentes. Cada edición crea una nueva versión e invalida el índice anterior. Revisa el estado de indexación y reintenta los errores. El índice usa Gemini embeddings de 768 dimensiones; las consultas combinan coincidencias de texto y similitud con un máximo de seis fragmentos.
7. Usa el simulador para validar respuestas y preguntas de seguimiento. La simulación permite consultar productos, pero no modifica contactos ni crea transferencias. La búsqueda textual de comprobación funciona sin llamar al proveedor.

Las llamadas de generación e indexación consumen la cuota de Gemini. La recuperación semántica solo usa fuentes activas y completamente indexadas; si falla, continúa la búsqueda textual. La biblioteca conserva texto extraído, no los archivos originales. Las versiones identifican actualizaciones; no constituyen un historial restaurable.

El chatbot consulta precios y stock con las herramientas de la tienda, usa el conocimiento aprobado para políticas y permite transferir a un asesor. Los pedidos requieren la sesión autenticada del cliente en la tienda. El historial web se obtiene de la base de datos para no aceptar respuestas anteriores falsificadas desde el navegador.

La búsqueda de vectores se realiza en PHP con lectura progresiva de la base de datos. Para bibliotecas muy grandes debe migrarse a un motor de búsqueda vectorial. La extracción de archivos y las peticiones de IA tienen límites; documentos sin texto o con formatos no admitidos se rechazan con un mensaje explicativo.

Diagnóstico: `php artisan chatbot:health` verifica configuración y fuentes sin mostrar claves. `php artisan chatbot:health --live` comprueba una respuesta real y consume cuota. Ejecuta `php artisan test --filter=ChatbotKnowledgeTest` para comprobar permisos, documentos, recuperación, configuración y herramientas con respuestas simuladas del proveedor.

`php artisan chatbot:health --embeddings` verifica que el proveedor devuelve vectores válidos para la búsqueda por significado.

Si PHP informa `cURL error 60` en Windows, configura `GEMINI_CA_BUNDLE` con la ruta absoluta a un archivo PEM de autoridades de confianza actualizado, o configura `curl.cainfo` en PHP. La verificación TLS permanece activa. No publiques certificados privados ni claves en el repositorio.

Referencias de la integración: [Gemini embeddings](https://ai.google.dev/gemini-api/docs/embeddings) y [firmas de pensamiento](https://ai.google.dev/gemini-api/docs/generate-content/thought-signatures).
