<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$start = microtime(true);
DB::table('producto')->count();
$end = microtime(true);

echo "Query Time: " . round(($end - $start) * 1000) . "ms\n";
