#!/usr/bin/env bash
set -Eeuo pipefail

project_dir="$(realpath -e -- "${1:?Project path required}")"
revision="${2:?Commit required}"
php_service="${3:?PHP-FPM service required}"
app_url="${4:?Public URL required}"
[[ "$project_dir" != / && "$revision" =~ ^[0-9a-f]{40}$ ]]
[[ -f "$project_dir/artisan" && -f "$project_dir/.env" && -d "$project_dir/storage" ]]
if [[ -f "$project_dir/storage/framework/down" ]]; then
    printf '%s\n' 'The application is already in maintenance mode; deployment is stopped.' >&2
    exit 1
fi
for executable in php composer rsync tar curl flock; do command -v "$executable" >/dev/null; done
sudo -n systemctl is-active --quiet "$php_service"

deployment_root="${NOVAPE_DEPLOY_ROOT:-$HOME/.cache/novape-deploy}"
mkdir -p "$deployment_root/backups"
chmod 700 "$deployment_root" "$deployment_root/backups"
exec 9>"$deployment_root/deploy.lock"
flock -n 9
archive="$deployment_root/uploads/$revision.tar.gz"
stage="$(mktemp -d "$deployment_root/stage.XXXXXX")"
tar --no-same-owner -xzf "$archive" -C "$stage"
[[ -f "$stage/artisan" && -f "$stage/vendor/autoload.php" && -f "$stage/public/build/manifest.json" ]]
exclusions="$stage/scripts/deploy-excludes.txt"
[[ -f "$exclusions" ]]
mkdir -p "$stage/bootstrap/cache"
ln -s "$project_dir/.env" "$stage/.env"
ln -s "$project_dir/storage" "$stage/storage"
cd "$stage"
composer check-platform-reqs --no-dev
php scripts/ci-migrations.php

backup="$deployment_root/backups/$(date +%Y%m%d_%H%M%S)_$revision"
mkdir -m 700 "$backup"
rsync -a --no-owner --no-group --exclude-from="$exclusions" "$project_dir/" "$backup/"

clear_bootstrap_cache() {
    rm -f -- "$project_dir/bootstrap/cache/config.php" \
        "$project_dir/bootstrap/cache/packages.php" "$project_dir/bootstrap/cache/services.php"
}
rollback() {
    local failure="$?"
    trap - ERR
    set +e
    printf 'Deployment failed. Restoring code from %s\n' "$backup" >&2
    rsync -a --no-owner --no-group --delete --exclude-from="$exclusions" "$backup/" "$project_dir/"
    clear_bootstrap_cache
    cd "$project_dir"
    php artisan package:discover --ansi
    php artisan config:cache
    php artisan route:clear
    php artisan view:clear
    sudo -n systemctl reload "$php_service"
    php artisan up
    exit "$failure"
}
trap rollback ERR
cd "$project_dir"
php artisan down --retry=15
rsync -a --no-owner --no-group --delete --exclude-from="$exclusions" "$stage/" "$project_dir/"
clear_bootstrap_cache
php artisan package:discover --ansi
php artisan config:cache
php artisan route:clear
php artisan view:clear
php artisan tinker --execute='foreach (["catalog_categorias_base", "home_categorias_menu_v3", "home_category_product_ids_v2", "home_weekly_product_ids_v2", "home_banners", "home_top_marcas", "config_all_values", "globalConfig", "store_image_paths_v1"] as $key) { Illuminate\Support\Facades\Cache::forget($key); }'
sudo -n systemctl reload "$php_service"
php artisan up
curl --fail --silent --show-error --retry 3 --retry-delay 2 --max-time 30 --output /dev/null "${app_url%/}/up"
curl --fail --silent --show-error --retry 3 --retry-delay 2 --max-time 30 --output /dev/null "${app_url%/}/"
php artisan queue:restart
php artisan reverb:restart
printf '%s\n' "$revision" > "$project_dir/.deploy-revision"
trap - ERR
printf 'Deployed %s. Previous code: %s\n' "$revision" "$backup"
# Retain the stage and backup for inspection; both are private to the deployment user.
