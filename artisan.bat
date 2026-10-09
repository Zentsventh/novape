@echo off
set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe;%PATH%"
php "%~dp0artisan" %*
