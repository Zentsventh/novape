# PowerShell script: eliminación definitiva de archivos no necesarios para producción
# -------------------------------------------------
# 360‑degree audit cleanup – repositorio listo para despliegue
# -------------------------------------------------

# 1️⃣ Definir rutas a eliminar (todo lo que no está en la whitelist)
$toDelete = @(
    "storage",
    "tests",
    "docs",
    ".github",
    "deploy/backup_db.sh",
    "deploy/fix_line_endings.py",
    "deploy/setup_novape.sh",
    "deploy/update_novape.sh",
    "deploy/clean_repo.sh",
    "deploy/clean_repo_ps1.ps1",
    "phpstan-full.txt",
    "phpstan-output.txt",
    "phpstan-report.txt",
    "phpstan.neon",
    "phpunit.xml",
    "junit.xml",
    "scripts",
    "test_images.php",
    "make()",
    "organizar.php",
    "responsive-check.mjs",
    "responsive-home-320.png",
    "*.md",
    "*.log",
    "*.zip",
    "public/*.webp",
    "public/*.png",
    "public/*.ico",
    "public/*.svg",
    "public/*.jpg",
    "public/*.jpeg",
    ".gitattributes"
)

# 2️⃣ Eliminar del índice de Git y del disco
foreach ($p in $toDelete) {
    if (Test-Path $p) {
        Write-Host "🗑️ Eliminando $p" -ForegroundColor Yellow
        # Eliminar del índice de Git (si está rastreado)
        git rm -r --cached $p 2>$null
        # Eliminar físicamente (forzar, recursivo)
        Remove-Item -Recurse -Force $p -ErrorAction SilentlyContinue
    }
}

# 3️⃣ Confirmar que todo quedó limpio
Write-Host "`n🔎 Verificando estado final del repositorio..." -ForegroundColor Cyan
git status --porcelain

# 4️⃣ Commit de la limpieza (opcional - el usuario puede hacerlo manualmente)
Write-Host "`nPreparando commit de limpieza" -ForegroundColor Cyan
git add .
$commit = git commit -m "Auditoría 360: eliminar archivos no necesarios para producción"
if ($LASTEXITCODE -ne 0) {
    Write-Host "No hay cambios para commitear" -ForegroundColor Green
}

Write-Host "Limpieza completada. El repositorio está listo para despliegue." -ForegroundColor Green
