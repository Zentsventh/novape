<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DocumentoController;

Route::post('/documento/consultar', [DocumentoController::class, 'consultar'])->name('api.documento.consultar');

Route::post('/log-frontend-error', function(Request $request) {
    \Illuminate\Support\Facades\Log::error('Frontend Error: ' . $request->input('message'), [
        'stack' => $request->input('stack')
    ]);
    return response()->json(['success' => true]);
});

// Inventory routes
Route::prefix('inventory')->group(function () {
    Route::apiResource('stocks', \App\Http\Controllers\Api\Inventory\StockController::class);
    Route::post('stocks/{stock}/adjust', [\App\Http\Controllers\Api\Inventory\StockController::class, 'adjust'])->name('stocks.adjust');
    Route::apiResource('warehouses', \App\Http\Controllers\Api\Inventory\WarehouseController::class);
});