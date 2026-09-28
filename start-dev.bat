@echo off
set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe;%PATH%"
echo ==============================================
echo   Iniciando Servidor NovaPe (Laravel + Vite)
echo ==============================================
npx concurrently -c "#93c5fd,#fdba74" "php artisan serve" "npm run dev" --names=laravel,vite --kill-others
