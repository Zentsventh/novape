#!/usr/bin/env bash
set -euo pipefail
repository="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
test_root="$(mktemp -d)"
trap 'rm -rf -- "$test_root"' EXIT
mkdir -p "$test_root/bin"
cat > "$test_root/bin/sudo" <<'MOCK'
#!/usr/bin/env bash
exit 0
MOCK
cat > "$test_root/bin/composer" <<'MOCK'
#!/usr/bin/env bash
exit 0
MOCK
cat > "$test_root/bin/curl" <<'MOCK'
#!/usr/bin/env bash
if [[ "${DEPLOY_TEST_FAIL_HEALTH:-0}" == 1 ]]; then exit 22; fi
exit 0
MOCK
cat > "$test_root/bin/php" <<'MOCK'
#!/usr/bin/env bash
if [[ "$1" == scripts/ci-migrations.php && "${DEPLOY_TEST_PENDING:-0}" == 1 ]]; then exit 2; fi
if [[ "$1" == artisan && "${2:-}" == down ]]; then touch "$DEPLOY_TEST_PROJECT/storage/framework/down"; fi
if [[ "$1" == artisan && "${2:-}" == up ]]; then rm -f -- "$DEPLOY_TEST_PROJECT/storage/framework/down"; fi
exit 0
MOCK
chmod +x "$test_root/bin/"*
revision='0123456789012345678901234567890123456789'

run_case() {
    local scenario="$1" expected_status="$2"
    local case_root="$test_root/$scenario"
    local project="$case_root/project" payload="$case_root/payload" state="$case_root/state"
    mkdir -p "$project/storage/framework" "$project/storage/app/public" "$project/public" "$project/bootstrap/cache" \
        "$payload/vendor" "$payload/public/build" "$payload/scripts" "$state/uploads"
    printf 'old\n' > "$project/code.txt"
    printf 'production-secret\n' > "$project/.env"
    printf 'photo\n' > "$project/storage/app/public/photo.webp"
    printf 'old bootstrap cache\n' > "$project/bootstrap/cache/packages.php"
    printf 'old\n' > "$project/artisan"
    ln -s "$project/storage/app/public" "$project/public/storage"
    printf 'new\n' > "$payload/code.txt"
    touch "$payload/artisan" "$payload/vendor/autoload.php"
    printf '{}\n' > "$payload/public/build/manifest.json"
    cp "$repository/scripts/deploy-excludes.txt" "$repository/scripts/ci-migrations.php" "$payload/scripts/"
    tar -czf "$state/uploads/$revision.tar.gz" -C "$payload" .
    local result=0
    PATH="$test_root/bin:$PATH" NOVAPE_DEPLOY_ROOT="$state" DEPLOY_TEST_PROJECT="$project" \
        DEPLOY_TEST_FAIL_HEALTH="$([[ "$scenario" == rollback ]] && echo 1 || echo 0)" \
        DEPLOY_TEST_PENDING="$([[ "$scenario" == pending ]] && echo 1 || echo 0)" \
        bash "$repository/scripts/ci-deploy.sh" "$project" "$revision" php8.3-fpm http://127.0.0.1 || result="$?"
    [[ "$result" == "$expected_status" ]]
    [[ "$(cat "$project/.env")" == production-secret ]]
    [[ "$(cat "$project/storage/app/public/photo.webp")" == photo ]]
    [[ -L "$project/public/storage" && ! -f "$project/storage/framework/down" ]]
    if [[ "$scenario" == success ]]; then
        [[ "$(cat "$project/code.txt")" == new ]]
        [[ "$(cat "$project/.deploy-revision")" == "$revision" ]]
    else
        [[ "$(cat "$project/code.txt")" == old && ! -f "$project/.deploy-revision" ]]
    fi
    printf 'PASS: %s; production configuration and media preserved\n' "$scenario"
}

run_case success 0
run_case rollback 22
run_case pending 2
