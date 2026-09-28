#!/bin/bash
set -e

echo "=== Starting Novape eCommerce Application ==="

# Ensure storage directories exist and have proper permissions
mkdir -p /var/www/html/storage/framework/cache/data \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/logs \
         /var/www/html/bootstrap/cache

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Run database migrations if RUN_MIGRATIONS is true (default: true)
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "Running database migrations..."
    php artisan migrate --force || echo "Migration warning: could not run migrations immediately (check DB connection)."
fi

# Cache configuration, routes, and views for lightning-fast serverless performance
if [ "${APP_ENV:-production}" = "production" ]; then
    echo "Optimizing Laravel caches for production..."
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
    php artisan event:cache || true
fi

echo "=== Novape eCommerce ready! Launching Apache ==="
exec apache2-foreground
