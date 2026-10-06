# Panel de control

El panel y el CRM comparten `AdminLayout`: navegación por permisos, grupos de módulos, búsqueda con Ctrl+K, notificaciones y menú adaptable. El estado de la navegación se conserva en este navegador.

## Mantener el diseño

- Registrar los módulos en `resources/js/Components/Admin/navigation.js` con la ruta y el permiso reales.
- Usar los colores y componentes de `resources/css/admin/workspace.css`; los ajustes del tablero están en `dashboard.css`.
- Mostrar errores y estados de procesamiento en las acciones. Los formularios deben impedir envíos duplicados.
- Los diálogos deben permitir Escape, mantener el foco y devolverlo al control que los abrió.
- Las tablas extensas deben desplazarse dentro de su contenedor, sin ensanchar la página.

## Verificación local

```powershell
php artisan test --compact
npm run build
node scripts/audit-panel-actions.mjs
php scripts/audit_admin_pages.php
php scripts/admin_audit_session.php
$env:PANEL_ORIGIN='http://127.0.0.1:8000'
node scripts/check-panel-redesign.mjs
php scripts/admin_audit_session.php cleanup
```

La auditoría del navegador requiere el servidor local activo y Chrome instalado. Comprueba escritorio y móvil, errores de JavaScript, desbordamientos y navegación interactiva. Omite las imágenes; revisarlas por separado cuando termine su transferencia. Los informes se guardan en `storage/logs/`.

La revisión estática detecta controles sin acción declarada. Debe complementarse con las pruebas del servidor y del navegador; no demuestra por sí sola el comportamiento de cada operación.
