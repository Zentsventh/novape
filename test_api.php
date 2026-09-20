<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$req = \Illuminate\Http\Request::create('/admin/api/omnichannel/conversations', 'GET');
$res = app(\App\Http\Controllers\Api\Omnichannel\ConversationApiController::class)->conversations($req);
echo json_encode($res);
