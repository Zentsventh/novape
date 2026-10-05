<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Api\DocumentApiService;
use Illuminate\Http\Request;

class DocumentoController extends Controller
{
    public function __construct(
        private readonly DocumentApiService $documentApiService
    ) {}

    public function consultar(Request $request)
    {
        $request->validate(['tipo' => 'required|in:DNI,RUC', 'numero' => 'required|string|max:11']);
        $tipo = $request->input('tipo');
        $numero = $request->input('numero');

        if (! $numero || ! in_array($tipo, ['DNI', 'RUC'])) {
            return response()->json(['error' => 'Tipo o número de documento inválido'], 400);
        }

        $result = $this->documentApiService->consultar($tipo, $numero);

        return response()->json($result);
    }
}
