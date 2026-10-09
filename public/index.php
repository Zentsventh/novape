<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../novape/storage/framework/maintenance.php')) {
    require $maintenance;
} elseif (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
if (file_exists(__DIR__.'/../novape/vendor/autoload.php')) {
    require __DIR__.'/../novape/vendor/autoload.php'; // cPanel
} else {
    require __DIR__.'/../vendor/autoload.php'; // Local
}

// Bootstrap Laravel and handle the request...
/** @var Application $app */
if (file_exists(__DIR__.'/../novape/bootstrap/app.php')) {
    $app = require_once __DIR__.'/../novape/bootstrap/app.php'; // cPanel
    $app->usePublicPath(__DIR__); // Le decimos a Vite que la carpeta pública ahora es public_html
} else {
    $app = require_once __DIR__.'/../bootstrap/app.php'; // Local
}

$app->handleRequest(Request::capture());
