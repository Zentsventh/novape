<?php

use App\Http\Controllers\Api\DocumentoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

Route::post('/documento/consultar', [DocumentoController::class, 'consultar'])->middleware('throttle:20,1')->name('api.documento.consultar');

Route::post('/log-frontend-error', function (Request $request) {
    $request->validate(['message' => 'required|string|max:2000', 'stack' => 'nullable|string|max:10000']);
    Log::error('Frontend Error: '.$request->input('message'), [
        'stack' => $request->input('stack'),
    ]);

    return response()->json(['success' => true]);
})->middleware('throttle:30,1');

// The unfinished UUID inventory prototype is intentionally not published.
// Operational inventory uses authenticated /admin/inventario and /admin/almacenes routes.
