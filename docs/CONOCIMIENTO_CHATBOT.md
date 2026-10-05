# Conocimiento del chatbot

En el menú **Comunicación → Conocimiento del chatbot** (`/admin/chatbot/conocimiento`), los trabajadores con `gestionar_ajustes` pueden introducir texto o subir PDF, DOCX, TXT y Markdown. Cada fuente tiene título, contenido editable y estado borrador/activa. Los documentos admiten hasta 5 MB y 200.000 caracteres extraídos. PDF escaneados requieren OCR previo; documentos cifrados o sin texto se rechazan. Solo se guarda el texto extraído en la base de datos, sin publicar el archivo original.

1. Añadir una fuente con un título claro, por ejemplo «Garantías de electrodomésticos».
2. Pegar el texto o seleccionar el documento y guardar como borrador.
3. Revisar y corregir el contenido extraído. Incluir condiciones, excepciones, fechas de vigencia y ejemplos de respuestas. Publicar únicamente información que pueda compartirse con clientes.
4. Marcar **Activa** y guardar.
5. Usar **Comprobar qué información encontrará** con preguntas de clientes. Esta prueba muestra los fragmentos relevantes sin llamar a Gemini ni enviar comunicaciones.

La consulta usa fragmentos de hasta 1.200 caracteres con solapamiento, búsqueda de términos normalizados (incluidos acentos) y orden por coincidencias. Se envían hasta seis fragmentos con sus títulos. No se generan embeddings ni se modifican los pesos del modelo: es conocimiento consultado en cada respuesta. Esta búsqueda requiere coincidencias de términos; conviene incluir sinónimos y vocabulario de clientes en las fuentes y comprobar preguntas reales. La calidad final de las respuestas sigue dependiendo del proveedor de IA.

El chat de tienda y el procesamiento de WhatsApp comparten esta biblioteca. Se mantiene la integración Gemini y sus credenciales existentes. La tienda comprueba precios, existencias y pedidos con sus herramientas actuales. Se retiraron los plazos, devoluciones y pagos fijos del prompt de tienda: esas condiciones deben provenir del contenido aprobado. El prompt trata los fragmentos como referencia factual y pide indicar cuando falte información o existan contradicciones. Desactivar o eliminar una fuente la excluye de las siguientes búsquedas; los mensajes ya enviados permanecen en el historial.

Esta biblioteca corresponde al chatbot integrado del proyecto principal. El subproyecto independiente `chatbot_novape` conserva su integración separada. Las configuraciones de automatización aún pendientes no se aplican mediante esta migración.

## Instalación y validación

Instalar dependencias del lock y respaldar la base antes de aplicar la migración nueva:

```text
composer install
php scripts/panel_database_backup.php
php artisan migrate --path=database/migrations/2026_10_05_170000_create_chatbot_knowledge.php --force
npm run build
php artisan queue:restart
```

Comprobaciones:

```text
php artisan test --compact --filter=ChatbotKnowledgeTest
php artisan test --compact
php vendor/bin/phpstan analyse --memory-limit=1G --no-progress
node scripts/check-chatbot-knowledge.mjs
```

El recorrido de navegador usa respuestas API de prueba, verifica edición/activación y anchos de 390/1440 px, y limpia su sesión temporal. No escribe conocimiento comercial ni consulta el proveedor. Las pruebas funcionales usan SQLite aislado y Gemini simulado, incluyendo extracción real de PDF/DOCX, control de permisos, borradores, eliminación y contenido enviado a la IA.

La extracción PDF usa [Smalot PDFParser](https://github.com/smalot/pdfparser/blob/master/doc/Usage.md). DOCX requiere las extensiones PHP ZIP y SimpleXML; su XML se lee sin entidades externas.

## Verificación local del 5 de octubre de 2026

La migración de conocimiento se aplicó en MySQL local después del respaldo privado `storage/app/private/panel-backup-20261005-161109.sql`. No se aplicaron las migraciones pendientes de automatizaciones o agenda. La biblioteca comercial permanece vacía.

La suite completa pasó con 130 pruebas y 524 aserciones; ocho pruebas son específicas del conocimiento. Vite compiló correctamente. El recorrido de navegador verificó borrador, activación, vista previa y pantallas de 390 y 1.440 px, sin desbordamientos ni errores JavaScript, usando fuentes simuladas. Las capturas y el informe están en `storage/logs/chatbot-knowledge-*`. Gemini se validó mediante HTTP simulado; no se enviaron documentos ni comunicaciones reales.
