#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------
#  Lista blanca (keep) – rutas que SE DEBEN conservar
# -------------------------------------------------
keep=(
  "app"
  "bootstrap"
  "config"
  "database"
  "public"
  "resources"
  "docker"
  "docker-compose.yml"
  "deploy/deploy_novape.sh"
  "composer.json"
  "composer.lock"
  "package.json"
  "package-lock.json"
  "vite.config.js"
  ".env.example"
  ".gitignore"
  "README.md"
  "LICENSE"
  "artisan"
)

# Build a regex pattern for whitelisted paths
pattern="($(printf "%s|" "${keep[@]}")")"
# Remove trailing '|'
pattern=${pattern%|}

# Find all tracked files (git) and delete those not in whitelist
all=$(git ls-files)
to_delete=()
for f in $all; do
  keep_flag=false
  for k in "${keep[@]}"; do
    if [[ $f == $k* ]]; then
      keep_flag=true
      break
    fi
  done
  if ! $keep_flag; then
    to_delete+=("$f")
  fi
done

if [ ${#to_delete[@]} -eq 0 ]; then
  echo "✅ No hay archivos que eliminar. Todo está en la lista blanca."
  exit 0
fi

echo "🚮 Se van a eliminar ${#to_delete[@]} archivos/directorios:";
printf "%s\n" "${to_delete[@]}"

read -p "¿Confirmas la eliminación? (y/N) " ans
if [[ "$ans" != "y" && "$ans" != "Y" ]]; then
  echo "❌ Operación abortada."
  exit 1
fi

# Eliminar físicamente y del índice de git
for f in "${to_delete[@]}"; do
  if [ -d "$f" ]; then
    rm -rf "$f"
  else
    rm -f "$f"
  fi
  git rm -r --cached "$f" 2>/dev/null || true
done

# Actualizar .gitignore para evitar volver a incluir estos archivos
cat >> .gitignore <<'EOF'
# Archivos y carpetas generados que no forman parte del despliegue
/storage
/node_modules
/public/*.webp
/public/*.png
/public/*.ico
/public/*.svg
/public/*.jpg
/public/*.jpeg
/docs/
*.md
*.zip
*.log
EOF

echo "✅ Limpieza completada."

