#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
dump_path="${1:-$HOME/novape_mysql_data.sql}"
if [[ "$(id -u)" == 0 ]]; then
    printf '%s\n' 'Ejecuta como azureuser: bash scripts/deployment-restore.sh' >&2
    exit 1
fi
[[ -f "$dump_path" && -f .env && -f vendor/autoload.php ]]
command -v mysql >/dev/null
expected_hash='11eb9954d884b48f6b0d8aef411deedba5a60568153a29e5400624db1e8b852c'
actual_hash="$(sha256sum -- "$dump_path")"
if [[ "${actual_hash:0:64}" != "$expected_hash" ]]; then
    printf '%s\n' 'El respaldo no coincide con el archivo revisado. Se detiene sin modificar la base.' >&2
    exit 1
fi
identity="$(php scripts/deployment-database.php identity)"
mapfile -t database_identity <<< "$identity"
[[ "${#database_identity[@]}" == 2 ]]
old_database="${database_identity[0]}"
database_user="${database_identity[1]}"
new_database="novape_restore_$(date +%Y%m%d_%H%M%S)_$$"

# Never import into the current database. A failed import leaves it untouched.
sudo mysql --batch --skip-column-names -e 'SELECT 1' >/dev/null
grants="$(sudo mysql --batch --skip-column-names -e "SELECT CONCAT('GRANT SELECT, INSERT, UPDATE, DELETE ON \`$new_database\`.* TO ', QUOTE(User), '@', QUOTE(Host), ';') FROM mysql.user WHERE User = '$database_user'")"
if [[ -z "$grants" ]]; then
    printf '%s\n' 'No se encontro el usuario existente de la aplicacion en mysql.user.' >&2
    exit 1
fi
printf 'Se conserva la base %s. Restaurando en %s...\n' "$old_database" "$new_database"
sudo mysql -e "CREATE DATABASE \`$new_database\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
php scripts/deployment-stream.php "$dump_path" | sudo mysql --unbuffered --batch "$new_database"
# Do not transfer development login sessions or cache entries to production.
sudo mysql "$new_database" -e 'DELETE FROM sessions; DELETE FROM cache; DELETE FROM cache_locks;'
printf '%s\n' "$grants" | sudo mysql

env_backup="$(php scripts/deployment-database.php activate "$new_database")"
rollback_configuration() {
    printf '%s\n' 'Fallo la activacion; restaurando la configuracion anterior.' >&2
    cp -- "$env_backup" .env
    php artisan config:clear || true
}
trap rollback_configuration ERR
php artisan config:clear
php artisan config:cache
php scripts/deployment-database.php verify "$new_database"
php artisan view:clear
php artisan tinker --execute='foreach (["catalog_categorias_base", "home_categorias_menu_v3", "home_category_product_ids_v2", "home_weekly_product_ids_v2", "home_banners", "home_top_marcas", "config_all_values", "globalConfig", "store_image_paths_v1"] as $key) { Illuminate\Support\Facades\Cache::forget($key); }'
php scripts/deployment-diagnose.php
trap - ERR
printf 'Restauracion terminada. Base anterior conservada: %s\nRespaldo privado de .env: %s\n' "$old_database" "$env_backup"
