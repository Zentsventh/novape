#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------
# Variables (customize for your environment)
# -------------------------------------------------
PROJECT_ROOT="/var/www/novape"
REPO_URL="https://github.com/tu_usuario/tu_repositorio.git"
BRANCH="main"

# -------------------------------------------------
# 1️⃣ Install host dependencies (Docker & Docker‑Compose)
# -------------------------------------------------
if ! command -v docker &>/dev/null; then
    echo "=== Installing Docker ==="
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

if ! command -v docker-compose &>/dev/null; then
    echo "=== Installing Docker‑Compose ==="
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.27.0/docker-compose-linux-x86_64" \
        -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# -------------------------------------------------
# 2️⃣ Clone or update the project repository
# -------------------------------------------------
if [ -d "$PROJECT_ROOT/.git" ]; then
    echo "=== Updating existing repository ==="
    cd "$PROJECT_ROOT"
    git fetch origin
    git reset --hard "origin/$BRANCH"
else
    echo "=== Cloning repository ==="
    sudo mkdir -p "$(dirname $PROJECT_ROOT)"
    sudo chown $USER:$USER "$(dirname $PROJECT_ROOT)"
    git clone -b "$BRANCH" "$REPO_URL" "$PROJECT_ROOT"
fi

cd "$PROJECT_ROOT"

# -------------------------------------------------
# 3️⃣ Ensure production environment file exists
# -------------------------------------------------
if [ ! -f .env.production ]; then
    echo "=== Creating .env.production (edit later) ==="
    cp .env.example .env.production
    echo "# Edit with real credentials before first deploy" >> .env.production
fi

# -------------------------------------------------
# 4️⃣ Build Docker images & start containers
# -------------------------------------------------
echo "=== Building Docker images ==="
docker compose build --no-cache

echo "=== Starting containers (detached) ==="
docker compose up -d

# -------------------------------------------------
# 5️⃣ Run migrations, seeders and optimise Laravel
# -------------------------------------------------
echo "=== Running migrations & seeders ==="
docker compose exec php-fpm php artisan migrate --force
docker compose exec php-fpm php artisan db:seed --force

echo "=== Caching config, routes and views ==="
docker compose exec php-fpm php artisan config:cache
docker compose exec php-fpm php artisan route:cache
docker compose exec php-fpm php artisan view:cache

echo "=== Deployment finished 🎉 ==="

