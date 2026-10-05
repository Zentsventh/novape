<?php

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Schema;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
foreach (['variante', 'pedido', 'pedido_item', 'rma_requests', 'crm_deals', 'cajas', 'almacenes', 'marketing_campaigns', 'crm_deal_products'] as $table) {
    $columns = Schema::getColumns($table);
    foreach ($columns as $column) {
        if (in_array($column['name'], ['id', 'variante_id'], true)) {
            echo $table.'.'.$column['name'].' '.$column['type'].PHP_EOL;
        }
    }
}
