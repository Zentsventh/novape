<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $ctrl = app()->make(App\Http\Controllers\ChatbotController::class);
    $req = Illuminate\Http\Request::create('/chatbot/message', 'POST', [
        'session_id' => 'tinker-test-123',
        'messages' => [['role' => 'user', 'text' => 'hola']]
    ]);
    
    $formReq = App\Http\Requests\Chatbot\ChatbotMessageRequest::createFrom($req);
    // Simular que paso la validación porque no estamos llamando a handle() del form request
    
    $res = $ctrl->message($formReq);
    echo $res->getContent();
} catch (\Exception $e) {
    echo 'ERROR: ' . $e->getMessage() . "\n" . $e->getTraceAsString();
}
