#!/usr/bin/env bash
set -euo pipefail

# Run as the deployment user: bash scripts/deployment-repair.sh
# This repairs runtime directories and the public media link; no SQL is imported.
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
project_dir="$(pwd -P)"
if [[ ! -f artisan || ! -f vendor/autoload.php || ! -f .env ]]; then
    printf '%s\n' 'Faltan artisan, vendor/autoload.php o .env. Ejecuta desde el proyecto instalado.' >&2
    exit 1
fi
if [[ "$(id -u)" == 0 ]]; then
    printf '%s\n' 'Ejecuta como azureuser, sin sudo delante de bash; el script solicita sudo donde corresponde.' >&2
    exit 1
fi
web_group="${NOVAPE_WEB_GROUP:-www-data}"
getent group "$web_group" >/dev/null
deployment_user="$(id -un)"

# Do not follow runtime links into unrelated directories when changing ownership.
for relative in storage bootstrap/cache; do
    if [[ -e "$relative" || -L "$relative" ]]; then
        resolved="$(realpath -- "$relative")"
        if [[ "$resolved" != "$project_dir/$relative" ]]; then
            printf 'Directorio externo o enlace inesperado: %s\n' "$relative" >&2
            exit 1
        fi
    fi
done
sudo mkdir -p storage/logs storage/framework/cache/data storage/framework/sessions storage/framework/views storage/app/public bootstrap/cache
sudo chown -R "$deployment_user:$web_group" storage bootstrap/cache
sudo find storage bootstrap/cache -type d -exec chmod 2775 {} +
sudo find storage bootstrap/cache -type f -exec chmod 664 {} +

if [[ -L public/storage ]]; then
    if [[ "$(readlink -f -- public/storage || true)" != "$project_dir/storage/app/public" ]]; then
        backup_link="public/storage.previous.$(date +%s).$$"
        sudo mv -- public/storage "$backup_link"
        php artisan storage:link
    fi
elif [[ -e public/storage ]]; then
    printf '%s\n' 'public/storage es un archivo o carpeta real. Se conserva; hay que revisar antes de sustituirlo.' >&2
    exit 1
else
    php artisan storage:link
fi

php artisan config:clear
php artisan config:cache
php artisan view:clear
# Forget only catalog metadata, retaining sessions, rate limits and locks.
php artisan tinker --execute='foreach (["catalog_categorias_base", "home_categorias_menu_v3", "home_category_product_ids_v2", "home_weekly_product_ids_v2", "home_banners", "home_top_marcas", "config_all_values", "globalConfig"] as $key) { Illuminate\Support\Facades\Cache::forget($key); }'
php scripts/deployment-diagnose.php
