#!/bin/bash
set -e

echo "Desplegando la aplicación (Modo Producción)..."

# 1. Poner en modo mantenimiento
php artisan down || true

# 2. Descargar últimos cambios (opcional si usas git)
# git pull origin main

# 3. Instalar dependencias de PHP
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# 4. Instalar dependencias de Node.js y compilar el frontend
npm install
npm run build

# 5. Ejecutar migraciones de la base de datos
php artisan migrate --force

# 6. Limpiar y optimizar cachés
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# 7. Reiniciar colas de trabajo (esencial para Webhooks de WhatsApp y MercadoPago)
php artisan queue:restart

# 8. Quitar modo mantenimiento
php artisan up

echo "¡Despliegue finalizado con éxito!"
